import React, { useState, useEffect, useRef } from 'react';
import './ColaboradorAutocomplete.css';
import avatarPlaceholder from '../../assets/avatar-placeholder.svg';

interface Colaborador {
  ID: string;
  NAME: string;
  LAST_NAME: string;
  PERSONAL_PHOTO?: string;
}

// Substituir o webhook por variável de ambiente
const BITRIX_WEBHOOK = import.meta.env.VITE_BITRIX_WEBHOOK;

async function fetchColaboradores(query: string, start = 0): Promise<{result: Colaborador[], next?: number}> {
  let url = `${BITRIX_WEBHOOK}/user.get?start=${start}`;
  if (query.trim()) {
    url += `&filter[NAME]=${encodeURIComponent(query)}`;
  }
  const res = await fetch(url);
  const data = await res.json();
  return { result: data.result || [], next: data.next };
}

export function ColaboradorAutocomplete(props: {
  label: string;
  multiple?: boolean;
  value: Colaborador[];
  onChange: (colabs: Colaborador[]) => void;
}) {
  const { label, multiple = false, value, onChange } = props;
  const [input, setInput] = useState('');
  const [sugestoes, setSugestoes] = useState<Colaborador[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [start, setStart] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const MAX_VISIBLE = 3;

  useEffect(() => {
    if (!showDropdown || input.trim() === '') {
      setSugestoes([]);
      setHasMore(false);
      setStart(0);
      return;
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      fetchColaboradores(input, 0).then(({ result, next }) => {
        setSugestoes(result);
        setStart(next ?? 0);
        setHasMore(!!next);
      }).catch(console.error);
    }, 300);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [input, showDropdown]);

  function handleSelect(colab: Colaborador) {
    if (multiple) {
      if (!value.find(v => v.ID === colab.ID)) {
        onChange([...value, colab]);
      }
      setInput('');
    } else {
      onChange([colab]);
      setInput(`${colab.NAME} ${colab.LAST_NAME}`);
      setShowDropdown(false);
    }
  }

  function handleRemove(colab: Colaborador) {
    onChange(value.filter(v => v.ID !== colab.ID));
  }

  function handleScroll(e: React.UIEvent<HTMLUListElement>) {
    const el = e.currentTarget;
    if (hasMore && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      fetchColaboradores(input, start).then(({ result, next }) => {
        setSugestoes(prev => [...prev, ...result]);
        setStart(next ?? 0);
        setHasMore(!!next);
      }).catch(console.error);
    }
  }

  return (
    <div className="colaborador-autocomplete-container">
      <label className="colaborador-label">{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          autoComplete="off"
          className="colaborador-input-modern"
          placeholder={`Digite o nome do ${label.toLowerCase()}`}
        />
        {multiple && value.length > 0 && (
          <div className="colaborador-nomes-lista-inline">
            {(showAll ? value : value.slice(0, MAX_VISIBLE)).map(colab => (
              <span key={colab.ID} className="colaborador-nome-lista-inline">
                {colab.NAME} {colab.LAST_NAME}
                <button type="button" onClick={() => handleRemove(colab)} className="colaborador-tag-remove">×</button>
              </span>
            ))}
            {value.length > MAX_VISIBLE && !showAll && (
              <button className="colaborador-nomes-mais" onClick={() => setShowAll(true)}>...<span className="sr-only">Ver todos</span></button>
            )}
            {showAll && value.length > MAX_VISIBLE && (
              <button className="colaborador-nomes-mais" onClick={() => setShowAll(false)}>×</button>
            )}
          </div>
        )}
      </div>
      {showDropdown && sugestoes.length > 0 && (
        <ul className="colaborador-dropdown-modern" ref={listRef} onScroll={handleScroll}>
          {sugestoes.map(colab => (
            <li
              key={colab.ID}
              className="colaborador-dropdown-item-modern"
              onMouseDown={() => handleSelect(colab)}
            >
              <img
                src={colab.PERSONAL_PHOTO || avatarPlaceholder}
                alt={colab.NAME}
                className="colaborador-avatar-modern"
              />
              <span>{colab.NAME} {colab.LAST_NAME}</span>
            </li>
          ))}
          {hasMore && (
            <li className="colaborador-dropdown-item-modern" style={{ justifyContent: 'center', color: '#888' }}>
              Carregando mais...
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export type { Colaborador };
