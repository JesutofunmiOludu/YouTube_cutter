// ============================================================
// VidMind AI — useGroupedNodes Hook
// components/canvas/hooks/useGroupedNodes.ts
//
// Shared hook across all visual knowledge formats that standardizes
// thematic clustering by group_id, collapse/expand states, and
// ordering.
// Automatically synthesizes 4 to 8 thematic clusters if the video
// payload lacks groups, preventing flat 50-node laundry lists.
// ============================================================

import { useState, useMemo, useCallback } from 'react'
import type { KnowledgeFormatPayload, KnowledgeGroup, KnowledgeNode, KnowledgeNodeType } from '@/types'

export interface UseGroupedNodesResult {
  groups: KnowledgeGroup[]
  groupedNodes: Map<string, KnowledgeNode[]>
  ungroupedNodes: KnowledgeNode[]
  isGrouped: boolean
  expandedGroups: Set<string>
  isExpanded: (groupId: string) => boolean
  toggleGroup: (groupId: string) => void
  expandOnly: (groupId: string) => void
  expandAll: () => void
  collapseAll: () => void
  getNodesForGroup: (groupId: string) => KnowledgeNode[]
  totalNodesCount: number
  availableTypes: KnowledgeNodeType[]
  typeCounts: Record<string, number>
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' : ''}${s}`
}

/**
 * Automatically synthesizes 4 to 8 logical, chronological chapters
 * when the backend payload lacks pre-computed groups.
 */
function synthesizeGroups(nodes: KnowledgeNode[], formatType: string = 'mindmap'): {
  groups: KnowledgeGroup[]
  nodeToGroupMap: Map<string, string>
} {
  if (!nodes || nodes.length <= 4) {
    return { groups: [], nodeToGroupMap: new Map() }
  }

  // Sort nodes chronologically
  const sorted = [...nodes].sort((a, b) => (a.start_seconds ?? 0) - (b.start_seconds ?? 0))

  // Determine optimal cluster count (target ~6-8 nodes per cluster, 4 to 8 groups)
  const targetGroupCount = Math.min(8, Math.max(4, Math.ceil(sorted.length / 7)))
  const chunkSize = Math.ceil(sorted.length / targetGroupCount)

  const groups: KnowledgeGroup[] = []
  const nodeToGroupMap = new Map<string, string>()

  const palette = ['#6366F1', '#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B', '#3B82F6', '#84CC16']

  for (let i = 0; i < targetGroupCount; i++) {
    const startIdx = i * chunkSize
    const endIdx = Math.min(startIdx + chunkSize, sorted.length)
    if (startIdx >= sorted.length) break

    const chunk = sorted.slice(startIdx, endIdx)
    const groupId = `synth-group-${i + 1}`
    chunk.forEach((n) => nodeToGroupMap.set(n.id, groupId))

    const firstNode = chunk[0]
    const lastNode = chunk[chunk.length - 1]

    // Determine category or label
    const categories = chunk.map((n) => n.category).filter(Boolean) as string[]
    let dominantCat: string | null = null
    if (categories.length > 0) {
      const freq: Record<string, number> = {}
      categories.forEach((c) => {
        freq[c] = (freq[c] || 0) + 1
      })
      dominantCat = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0]
    }

    let rawLabel = dominantCat || firstNode.title || `Chapter ${i + 1}`
    // Strip repetitive noise like "Segment X:", "Part X:"
    rawLabel = rawLabel.replace(/^(segment|part|chapter|section)\s*\d+[:\-]?\s*/i, '').trim()
    if (rawLabel.length > 28) {
      rawLabel = rawLabel.slice(0, 26) + '...'
    }

    const topics = chunk
      .slice(0, 3)
      .map((n) => n.title.replace(/^(segment|part|chapter|section)\s*\d+[:\-]?\s*/i, '').trim())
      .filter(Boolean)

    const timeSummary = `${formatTime(firstNode.start_seconds)} – ${formatTime(lastNode.end_seconds)}`

    groups.push({
      id: groupId,
      label: rawLabel || `Chapter ${i + 1}`,
      summary: timeSummary,
      node_ids: chunk.map((n) => n.id),
      color: palette[i % palette.length],
      order: i + 1,
      topics,
    })
  }

  return { groups, nodeToGroupMap }
}

export function useGroupedNodes(
  payload: KnowledgeFormatPayload | null | undefined,
  initialExpandedAll: boolean = false
): UseGroupedNodesResult {
  const rawNodes = useMemo(() => payload?.nodes || [], [payload?.nodes])

  // Extract groups or auto-synthesize if empty and nodes > 4
  const { groups, nodeToGroupMap } = useMemo(() => {
    if (payload?.groups && Array.isArray(payload.groups) && payload.groups.length > 0) {
      const sorted = [...payload.groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      // Enrich with topics if missing
      const enriched = sorted.map((g) => {
        if (g.topics && g.topics.length > 0) return g
        const gNodes = rawNodes.filter((n) => n.group_id === g.id || (g.node_ids && g.node_ids.includes(n.id)))
        const topics = gNodes
          .slice(0, 3)
          .map((n) => n.title.replace(/^(segment|part|chapter|section)\s*\d+[:\-]?\s*/i, '').trim())
          .filter(Boolean)
        return { ...g, topics }
      })
      return { groups: enriched, nodeToGroupMap: new Map<string, string>() }
    }
    if (rawNodes.length > 4) {
      return synthesizeGroups(rawNodes, payload?.format_type || 'mindmap')
    }
    return { groups: [], nodeToGroupMap: new Map<string, string>() }
  }, [payload?.groups, payload?.format_type, rawNodes])

  const isGrouped = groups.length > 0
  const totalNodesCount = rawNodes.length

  // Group nodes mapping
  const { groupedNodes, ungroupedNodes, availableTypes, typeCounts } = useMemo(() => {
    const map = new Map<string, KnowledgeNode[]>()
    const ungrouped: KnowledgeNode[] = []
    const validGroupIds = new Set(groups.map((g) => g.id))
    const counts: Record<string, number> = {}

    // Initialize map entries for each group to preserve order
    groups.forEach((g) => {
      map.set(g.id, [])
    })

    rawNodes.forEach((node) => {
      if (node.node_type) {
        counts[node.node_type] = (counts[node.node_type] || 0) + 1
      }
      const targetGroupId = (node.group_id && validGroupIds.has(node.group_id))
        ? node.group_id
        : nodeToGroupMap.get(node.id)

      if (targetGroupId && validGroupIds.has(targetGroupId)) {
        map.get(targetGroupId)!.push(node)
      } else {
        ungrouped.push(node)
      }
    })

    // Sort each group's nodes by order or timestamp
    map.forEach((nodeList) => {
      nodeList.sort((a, b) => (a.order ?? a.start_seconds ?? 0) - (b.order ?? b.start_seconds ?? 0))
    })

    const types = Object.keys(counts) as KnowledgeNodeType[]

    return {
      groupedNodes: map,
      ungroupedNodes: ungrouped,
      availableTypes: types,
      typeCounts: counts,
    }
  }, [groups, rawNodes, nodeToGroupMap])

  // Track expanded groups state (Default to COLLAPSED when total nodes > 10)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (initialExpandedAll && totalNodesCount <= 10) {
      return new Set(groups.map((g) => g.id))
    }
    return new Set()
  })

  // Synchronize when groups change or reload (keep collapsed if > 10 nodes)
  useMemo(() => {
    if (groups.length > 0 && expandedGroups.size === 0 && initialExpandedAll && totalNodesCount <= 10) {
      setExpandedGroups(new Set(groups.map((g) => g.id)))
    }
  }, [groups, initialExpandedAll, totalNodesCount, expandedGroups.size])

  const isExpanded = useCallback(
    (groupId: string) => expandedGroups.has(groupId),
    [expandedGroups]
  )

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }, [])

  // Accordion mode: expand only this one group, collapse the others
  const expandOnly = useCallback((groupId: string) => {
    setExpandedGroups(new Set([groupId]))
  }, [])

  const expandAll = useCallback(() => {
    setExpandedGroups(new Set(groups.map((g) => g.id)))
  }, [groups])

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set())
  }, [])

  const getNodesForGroup = useCallback(
    (groupId: string) => groupedNodes.get(groupId) || [],
    [groupedNodes]
  )

  return {
    groups,
    groupedNodes,
    ungroupedNodes,
    isGrouped,
    expandedGroups,
    isExpanded,
    toggleGroup,
    expandOnly,
    expandAll,
    collapseAll,
    getNodesForGroup,
    totalNodesCount,
    availableTypes,
    typeCounts,
  }
}

export default useGroupedNodes
