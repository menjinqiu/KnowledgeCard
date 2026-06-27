import {
  CARD_DOMAINS,
  CARD_TYPES,
  CARD_VALIDITIES,
  IMPORTANCE_LEVELS,
} from '../types/card';
import type { CardFilters } from '../services/cardService';

type SidebarFiltersProps = {
  filters: CardFilters;
  tags: string[];
  onChange: (filters: CardFilters) => void;
  compact?: boolean;
};

function getActiveFilterCount(filters: CardFilters) {
  return [
    filters.domain,
    filters.type,
    filters.tag,
    filters.validity,
    filters.importance,
    filters.favorite,
    filters.archived !== 'active',
  ].filter(Boolean).length;
}

function getFilterLabelClass(active: boolean) {
  return active ? 'filter-field active' : 'filter-field';
}

export function SidebarFilters({
  filters,
  tags,
  onChange,
  compact = false,
}: SidebarFiltersProps) {
  const patchFilters = (patch: Partial<CardFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const activeCount = getActiveFilterCount(filters);

  return (
    <aside className={compact ? 'filters-panel compact no-print' : 'filters-panel no-print'}>
      <div className="filters-head">
        <div>
          <h2>筛选</h2>
          <p>{activeCount > 0 ? `${activeCount} 个条件已启用` : '默认显示未归档卡片'}</p>
        </div>
        <button
          type="button"
          className="text-button"
          onClick={() =>
            onChange({
              query: filters.query,
              domain: '',
              type: '',
              tag: '',
              validity: '',
              importance: '',
              favorite: false,
              archived: 'active',
            })
          }
        >
          重置
        </button>
      </div>

      <div className="filter-section">
        <span className="filter-section-title">分类</span>
        <label className={getFilterLabelClass(Boolean(filters.domain))}>
          <span>领域</span>
          <select
            value={filters.domain}
            onChange={(event) => patchFilters({ domain: event.target.value as CardFilters['domain'] })}
          >
            <option value="">全部领域</option>
            {CARD_DOMAINS.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
        </label>

        <label className={getFilterLabelClass(Boolean(filters.type))}>
          <span>类型</span>
          <select
            value={filters.type}
            onChange={(event) => patchFilters({ type: event.target.value as CardFilters['type'] })}
          >
            <option value="">全部类型</option>
            {CARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <label className={getFilterLabelClass(Boolean(filters.tag))}>
          <span>标签</span>
          <select value={filters.tag} onChange={(event) => patchFilters({ tag: event.target.value })}>
            <option value="">全部标签</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="filter-section">
        <span className="filter-section-title">状态</span>
        <label className={getFilterLabelClass(Boolean(filters.validity))}>
          <span>时效</span>
          <select
            value={filters.validity}
            onChange={(event) =>
              patchFilters({ validity: event.target.value as CardFilters['validity'] })
            }
          >
            <option value="">全部时效</option>
            {CARD_VALIDITIES.map((validity) => (
              <option key={validity} value={validity}>
                {validity}
              </option>
            ))}
          </select>
        </label>

        <label className={getFilterLabelClass(Boolean(filters.importance))}>
          <span>重要程度</span>
          <select
            value={filters.importance}
            onChange={(event) =>
              patchFilters({
                importance: event.target.value
                  ? (Number(event.target.value) as CardFilters['importance'])
                  : '',
              })
            }
          >
            <option value="">全部重要度</option>
            {IMPORTANCE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-row filter-checkbox-row">
          <input
            type="checkbox"
            checked={filters.favorite}
            onChange={(event) => patchFilters({ favorite: event.target.checked })}
          />
          <span>只看收藏</span>
        </label>

        <label className={getFilterLabelClass(filters.archived !== 'active')}>
          <span>归档</span>
          <select
            value={filters.archived}
            onChange={(event) =>
              patchFilters({ archived: event.target.value as CardFilters['archived'] })
            }
          >
            <option value="active">未归档</option>
            <option value="archived">已归档</option>
            <option value="all">全部</option>
          </select>
        </label>
      </div>
    </aside>
  );
}
