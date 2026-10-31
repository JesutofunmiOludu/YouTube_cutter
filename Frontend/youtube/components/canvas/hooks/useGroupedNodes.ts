// ============================================================
// VidMind AI — useGroupedNodes Hook
// components/canvas/hooks/useGroupedNodes.ts
//
// Shared hook across all visual knowledge formats that standardizes
// thematic clustering by group_id, collapse/expand states, and
// ordering.
// ============================================================

import { useState, useMemo, useCallback } from 'react'
import type { KnowledgeFormatPayload, KnowledgeGroup, KnowledgeNode } from '@/types'

export interface UseGroupedNodesResult {
  groups: KnowledgeGroup[]
  groupedNodes: Map<string, KnowledgeNode[]>
  ungroupedNodes: KnowledgeNode[]
  isGrouped: boolean
  expandedGroups: Set<string>
  isExpanded: (groupId: string) => boolean
  toggleGroup: (groupId: string) => void
  expandAll: () => void
  collapseAll: () => void
  getNodesForGroup: (groupId: string) => KnowledgeNode[]
  totalNodesCount: number
}

export function useGroupedNodes(
  payload: KnowledgeFormatPayload | null | undefined,
  initialExpandedAll: boolean = true
): UseGroupedNodesResult {
  const groups = useMemo(() => {
    if (!payload?.groups || !Array.isArray(payload.groups) || payload.groups.length === 0) {
      return []
    }
    return [...payload.groups].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }, [payload?.groups])

  const isGrouped = groups.length > 0

  // Group nodes mapping
  const { groupedNodes, ungroupedNodes } = useMemo(() => {
    const map = new Map<string, KnowledgeNode[]>()
    const ungrouped: KnowledgeNode[] = []
    const validGroupIds = new Set(groups.map((g) => g.id))

    // Initialize map entries for each group to preserve order
    groups.forEach((g) => {
      map.set(g.id, [])
    })

    const nodes = payload?.nodes || []
    nodes.forEach((node) => {
      if (node.group_id && validGroupIds.has(node.group_id)) {
        map.get(node.group_id)!.push(node)
      } else {
        ungrouped.push(node)
      }
    })

    // Sort each group's nodes by order
    map.forEach((nodeList) => {
      nodeList.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    })

    return { groupedNodes: map, ungroupedNodes: ungrouped }
  }, [groups, payload?.nodes])

  // Track expanded groups state
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => {
    if (initialExpandedAll) {
      return new Set(groups.map((g) => g.id))
    }
    return new Set(groups.slice(0, 1).map((g) => g.id))
  })

  // Synchronize when groups change
  useMemo(() => {
    if (groups.length > 0 && expandedGroups.size === 0 && initialExpandedAll) {
      setExpandedGroups(new Set(groups.map((g) => g.id)))
    }
  }, [groups, initialExpandedAll, expandedGroups.size])

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

  const totalNodesCount = payload?.nodes?.length || 0

  return {
    groups,
    groupedNodes,
    ungroupedNodes,
    isGrouped,
    expandedGroups,
    isExpanded,
    toggleGroup,
    expandAll,
    collapseAll,
    getNodesForGroup,
    totalNodesCount,
  }
}

export default useGroupedNodes

