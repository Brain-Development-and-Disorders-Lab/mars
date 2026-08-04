import { useMemo, useState } from "react";

type HistoryEntry = { timestamp: string };

/**
 * Sorts and date-filters a version history list, shared by Entity, Project, and Template `HistoryDrawer` instances
 * @param {HistoryEntry[]} history raw, unsorted version history
 */
export const useHistorySort = <T extends HistoryEntry>(history: T[]) => {
  const [sortOrder, setSortOrder] = useState<"newest-first" | "oldest-first">("newest-first");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStartDate, setAppliedStartDate] = useState("");
  const [appliedEndDate, setAppliedEndDate] = useState("");
  const [dateFilterApplied, setDateFilterApplied] = useState(false);

  const sorted = useMemo(() => {
    let filtered = [...history];

    if (dateFilterApplied) {
      filtered = filtered.filter((entry) => {
        const entryDate = new Date(entry.timestamp);
        const entryDateOnly = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

        if (appliedStartDate && entryDateOnly < new Date(appliedStartDate)) {
          return false;
        }

        if (appliedEndDate) {
          const end = new Date(appliedEndDate);
          end.setHours(23, 59, 59, 999);
          if (entryDateOnly > end) return false;
        }

        return true;
      });
    }

    return filtered.sort((a, b) =>
      sortOrder === "newest-first"
        ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  }, [history, sortOrder, dateFilterApplied, appliedStartDate, appliedEndDate]);

  const applyDateFilter = () => {
    if (startDate || endDate) {
      setAppliedStartDate(startDate);
      setAppliedEndDate(endDate);
      setDateFilterApplied(true);
    }
  };

  const resetDateFilter = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStartDate("");
    setAppliedEndDate("");
    setDateFilterApplied(false);
  };

  return {
    sorted,
    sortOrder,
    setSortOrder,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    applyDateFilter,
    resetDateFilter,
  };
};
