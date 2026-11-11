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

function trimAtWordBoundary(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  const sliced = text.slice(0, maxLen)
  const lastSpace = sliced.lastIndexOf(' ')
  return (lastSpace >= Math.floor(maxLen * 0.5) ? sliced.slice(0, lastSpace) : sliced).trim()
}

function resolveMeaningfulLabel(rawLabel: string, chunkNodes: KnowledgeNode[]): string {
  const prefixRegex = /^(branch|segment|part|chapter|section|pillar|cluster|phase|stage|domain|era)\s*\d+[:\-]?\s*/i
  const isGeneric =
    !rawLabel ||
    /^(branch|segment|part|chapter|section|pillar|cluster|phase|stage|domain|era)\s*\d*[:\-]?\s*$/i.test(
      rawLabel.trim()
    )

  if (isGeneric && chunkNodes.length > 0) {
    // Try to extract a shared prefix before colon (e.g. "SQL Data Types: CHAR..." -> "SQL Data Types")
    const firstTitle = chunkNodes[0].title || ''
    const colonMatch = firstTitle.match(/^([^:\-–]+)[:\-–]/)
    if (colonMatch && colonMatch[1].trim().length >= 4) {
      return trimAtWordBoundary(colonMatch[1].trim(), 46)
    }
    const cleanFirst = firstTitle.replace(prefixRegex, '').trim()
    if (cleanFirst) return trimAtWordBoundary(cleanFirst, 46)
  }

  let cleaned = rawLabel.replace(prefixRegex, '').trim()

  // Recover full words when backend fallback truncated the group label mid-word at [:30]
  if (cleaned && chunkNodes.length > 0) {
    const firstTitle = (chunkNodes[0].title || '').trim()
    if (firstTitle.length > cleaned.length && firstTitle.startsWith(cleaned)) {
      const clauseMatch = firstTitle.match(/^(.{12,42}?[?])(?:\s|$)|^(.{12,42}?)[:\-–](?:\s|$)/)
      const matchedClause = (clauseMatch?.[1] || clauseMatch?.[2] || '').trim()
      if (matchedClause.length >= 12) {
        cleaned = matchedClause
      } else if (firstTitle.length <= 44) {
        cleaned = firstTitle
      } else {
        cleaned = trimAtWordBoundary(firstTitle, 44)
      }
    }
  }

  if (cleaned.length > 46) {
    cleaned = trimAtWordBoundary(cleaned, 44) + '...'
  }
  return cleaned || 'Key Concepts'
}

function extractCleanTopics(chunkNodes: KnowledgeNode[], groupLabel: string): string[] {
  return chunkNodes
    .slice(0, 3)
    .map((n) => {
      let t = n.title.replace(/^(segment|part|chapter|section|branch)\s*\d+[:\-]?\s*/i, '').trim()
      if (groupLabel && groupLabel.length >= 4) {
        const pRegex = new RegExp(`^${groupLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[:\\-–]?\\s*`, 'i')
        t = t.replace(pRegex, '')
      }
      t = t.replace(/^(sql\s*(data\s*types?|constraints?)?|overview|intro)[:\-–]\s*/i, '')
      if (t.length > 24) {
        t = t.slice(0, 22) + '...'
      }
      return t.trim()
    })
    .filter(Boolean)
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

    const label = resolveMeaningfulLabel(dominantCat || firstNode.title || `Chapter ${i + 1}`, chunk)
    const topics = extractCleanTopics(chunk, label)
    const timeSummary = `${formatTime(firstNode.start_seconds)} – ${formatTime(lastNode.end_seconds)}`

    groups.push({
      id: groupId,
      label,
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
      // Enrich with meaningful titles & topics if generic or missing
      const enriched = sorted.map((g) => {
        const gNodes = rawNodes.filter((n) => n.group_id === g.id || (g.node_ids && g.node_ids.includes(n.id)))
        const meaningfulLabel = resolveMeaningfulLabel(g.label, gNodes)
        const topics = (g.topics && g.topics.length > 0)
          ? g.topics
          : extractCleanTopics(gNodes, meaningfulLabel)
        return { ...g, label: meaningfulLabel, topics }
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
