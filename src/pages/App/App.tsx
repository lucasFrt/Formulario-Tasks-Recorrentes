import { useState } from 'react';
import { ColaboradorAutocomplete } from '../../components/ColaboradorAutocomplete';
import type { Colaborador } from '../../components/ColaboradorAutocomplete';
import './App.css';

function App() {
  const [criador, setCriador] = useState<Colaborador[]>([]);
  const [responsaveis, setResponsaveis] = useState<Colaborador[]>([]);
  const [participantes, setParticipantes] = useState<Colaborador[]>([]);
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    nomeTarefa: '',
    dataInicial: '',
    prazoDias: '',
    descricao: '',
    listaChecagem: '',
    periodo: '',
    termino: '',
    qtdRepeticoes: '', // Para "Depois de X repetições"
    dataTermino: '',   // Para "Data fixa"
  });
  const [periodoDias, setPeriodoDias] = useState('');
  const [diasSemana, setDiasSemana] = useState<string[]>([]);
  const [diasMes, setDiasMes] = useState<number[]>([]);

  const opcoesPeriodo = [
    { label: 'Diário', value: 'diario' },
    { label: 'Semanal', value: 'semanal' },
    { label: 'Mensal', value: 'mensal' },
  ];
  const opcoesSemana = [
    'Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'
  ];
  const opcoesMes = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Função para checar se todos os campos obrigatórios da nova primeira página estão preenchidos
  const isNovaPrimeiraPaginaValida =
    form.nomeTarefa.trim() !== '' &&
    form.descricao.trim() !== '' &&
    form.dataInicial.trim() !== '' &&
    form.periodo !== '';

  // Função para checar se todos os campos obrigatórios da segunda página estão preenchidos
  const isSegundaPaginaValida = () => {
    if (form.periodo === 'diario' && (!periodoDias || Number(periodoDias) < 1)) return false;
    if (form.periodo === 'semanal' && diasSemana.length === 0) return false;
    if (form.periodo === 'mensal' && diasMes.length === 0) return false;
    if (!criador[0]) return false;
    if (!responsaveis[0]) return false;
    // Participantes pode ser vazio
    if (form.termino === 'repeticoes' && (!form.qtdRepeticoes || Number(form.qtdRepeticoes) < 1)) return false;
    if (form.termino === 'data' && !form.dataTermino) return false;
    return true;
  };

  const [touched, setTouched] = useState<{[key: string]: boolean}>({});

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const BITRIX_DEAL_WEBHOOK = import.meta.env.VITE_BITRIX_DEAL_WEBHOOK;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validação final antes do envio
    if (page === 1 && !isNovaPrimeiraPaginaValida) {
      setTouched({ nomeTarefa: true, descricao: true, dataInicial: true, periodo: true });
      return;
    }
    if (page === 2 && !isSegundaPaginaValida()) {
      setTouched(prev => ({
        ...prev,
        periodoDias: true,
        diasSemana: true,
        diasMes: true,
        criador: true,
        responsaveis: true,
        qtdRepeticoes: true,
        dataTermino: true
      }));
      alert('Preencha todos os campos obrigatórios!');
      return;
    }
    // Mapeamento dos campos do formulário para os campos do Bitrix24
    const payload = {
      fields: {
        UF_CRM_1748353685: form.nomeTarefa, // Nome da tarefa
        UF_CRM_1752783592: form.descricao, // Descrição
        UF_CRM_1752783504: form.dataInicial, // Data de início
        UF_CRM_1748354913: form.prazoDias, // Prazo
        UF_CRM_1752783776: responsaveis[0]?.ID || '', // Responsável (único)
        UF_CRM_1752783804: participantes.map(p => p.ID).join(','), // Participantes (múltiplos)
        UF_CRM_1752783730: criador[0]?.ID || '', // Criador (único)
        UF_CRM_1748354079: form.periodo === 'diario' ? periodoDias : form.periodo === 'semanal' ? diasSemana.join(',') : form.periodo === 'mensal' ? diasMes.join(',') : '', // Período de tempo
        UF_CRM_1748354185: form.termino === 'data' ? form.dataTermino : form.termino === 'repeticoes' ? form.qtdRepeticoes : '', // Data de término ou repetições
        CATEGORY_ID: 82, // ID do funil (pipeline) específico
      }
    };
    try {
      const res = await fetch(`${BITRIX_DEAL_WEBHOOK}/crm.deal.add.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data && data.result) {
        alert(`Card criado com sucesso! ID: ${data.result}`);
      } else {
        alert('Erro ao criar card no Bitrix24.');
      }
    } catch {
      alert('Erro ao conectar com Bitrix24.');
    }
  };

  return (
    <>
      <div className="background-detail">
        <div className="layer1"></div>
        <div className="layer2"></div>
        <div className="layer3"></div>
      </div>
      <div className="app-formulario">
        <form onSubmit={handleSubmit}>
          {/* Título dentro do formulário */}
          {page === 1 ? (
            <div className="colaborador-autocomplete-card">
              <h2 className="colaborador-title" style={{marginBottom: 24}}>Recorrencia de Tarefas</h2>
              <div style={{display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start', width: '100%'}}>
                <label className="colaborador-label">Nome das Tarefas *</label>
                <input
                  className={`colaborador-input-modern${(touched['nomeTarefa'] && form.nomeTarefa.trim() === '') ? ' obrigatorio-vazio' : ''}`}
                  name="nomeTarefa"
                  value={form.nomeTarefa}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Digite o nome da tarefa"
                  style={{textAlign: 'left'}}
                />
                <label className="colaborador-label">Descrição *</label>
                <textarea
                  className={`colaborador-input-modern${(touched['descricao'] && form.descricao.trim() === '') ? ' obrigatorio-vazio' : ''}`}
                  name="descricao"
                  value={form.descricao}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Descreva a tarefa"
                  style={{resize: 'vertical', minHeight: 60, textAlign: 'left'}}
                />
                <label className="colaborador-label">Data de Início da Recorrência *</label>
                <input
                  className={`colaborador-input-modern${(touched['dataInicial'] && form.dataInicial.trim() === '') ? ' obrigatorio-vazio' : ''}`}
                  name="dataInicial"
                  type="date"
                  value={form.dataInicial}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  style={{textAlign: 'left'}}
                />
                <label className="colaborador-label">Período *</label>
                <select
                  className={`colaborador-input-modern${(touched['periodo'] && form.periodo === '') ? ' obrigatorio-vazio' : ''}`}
                  name="periodo"
                  value={form.periodo}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  style={{textAlign: 'left'}}
                >
                  <option value="">Selecione o período</option>
                  {opcoesPeriodo.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <button
                className="colaborador-btn-modern"
                type="button"
                style={{marginTop: 32, opacity: isNovaPrimeiraPaginaValida ? 1 : 0.5, cursor: isNovaPrimeiraPaginaValida ? 'pointer' : 'not-allowed'}}
                onClick={() => {
                  setTouched({ nomeTarefa: true, descricao: true, dataInicial: true, periodo: true });
                  if (isNovaPrimeiraPaginaValida) setPage(2);
                }}
                disabled={!isNovaPrimeiraPaginaValida}
              >
                Continuar →
              </button>
            </div>
          ) : (
            <div className="colaborador-autocomplete-card scrollable">
              <h2 className="colaborador-title" style={{marginBottom: 24}}>Recorrencia de Tarefas</h2>
              <button
                className="colaborador-btn-voltar"
                type="button"
                onClick={() => setPage(1)}
                style={{alignSelf: 'flex-start', marginBottom: 24, position: 'static'}}
              >
                ← Voltar
              </button>
              <div style={{display: 'flex', flexDirection: 'column', gap: 4, width: '100%'}}>
                {form.periodo === 'diario' && (
                  <label className="colaborador-label">Período de tempo
                    <input
                      className={`colaborador-input-modern${(touched['periodoDias'] && (!periodoDias || Number(periodoDias) < 1)) ? ' obrigatorio-vazio' : ''}`}
                      type="number"
                      min="1"
                      value={periodoDias}
                      onChange={e => setPeriodoDias(e.target.value)}
                      onBlur={() => setTouched(prev => ({ ...prev, periodoDias: true }))}
                      placeholder="A cada X dias"
                    />
                  </label>
                )}
                {form.periodo === 'semanal' && (
                  <label className="colaborador-label">Dias da semana
                    <select
                      className={`colaborador-input-modern${(touched['diasSemana'] && diasSemana.length === 0) ? ' obrigatorio-vazio' : ''}`}
                      multiple
                      value={diasSemana}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions, o => o.value);
                        setDiasSemana(options);
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, diasSemana: true }))}
                      style={{height: 120}}
                    >
                      {opcoesSemana.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </label>
                )}
                {form.periodo === 'mensal' && (
                  <label className="colaborador-label">Dias de criação de tarefas 
                    <select
                      className={`colaborador-input-modern${(touched['diasMes'] && diasMes.length === 0) ? ' obrigatorio-vazio' : ''}`}
                      multiple
                      value={diasMes.map(String)}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions, o => Number(o.value));
                        setDiasMes(options);
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, diasMes: true }))}
                      style={{height: 120}}
                    >
                      {opcoesMes.map(dia => (
                        <option key={dia} value={dia}>{dia}</option>
                      ))}
                    </select>
                  </label>
                )}
                {/* Feedback visual para ColaboradorAutocomplete pode ser feito externamente se necessário */}
                <ColaboradorAutocomplete label="Criador" value={criador} onChange={setCriador} />
                {touched['criador'] && !criador[0] && <span className="obrigatorio-vazio" style={{color:'#e53935', fontSize:12}}>Selecione o criador</span>}
                <ColaboradorAutocomplete label="Responsável" value={responsaveis} onChange={setResponsaveis} />
                {touched['responsaveis'] && !responsaveis[0] && <span className="obrigatorio-vazio" style={{color:'#e53935', fontSize:12}}>Selecione o responsável</span>}
                <ColaboradorAutocomplete label="Participantes" multiple value={participantes} onChange={setParticipantes} />
                <label className="colaborador-label">Prazo em dias para cada tarefa (opcional)
                  <input className="colaborador-input-modern" name="prazoDias" type="number" min="0" value={form.prazoDias} onChange={handleChange} placeholder="Ex: 5" />
                </label>
                <label className="colaborador-label">Término</label>
                <select
                  className="colaborador-input-modern"
                  name="termino"
                  value={form.termino || ''}
                  onChange={e => setForm({ ...form, termino: e.target.value })}
                  style={{textAlign: 'left'}}
                >
                  <option value="">Selecione o término</option>
                  <option value="nunca">Nunca</option>
                  <option value="repeticoes">Depois de X repetições</option>
                  <option value="data">Data fixa</option>
                </select>
                {form.termino === 'repeticoes' && (
                  <label className="colaborador-label">Quantidade de repetições
                    <input
                      className={`colaborador-input-modern${(touched['qtdRepeticoes'] && (!form.qtdRepeticoes || Number(form.qtdRepeticoes) < 1)) ? ' obrigatorio-vazio' : ''}`}
                      type="number"
                      min="1"
                      name="qtdRepeticoes"
                      value={form.qtdRepeticoes || ''}
                      onChange={e => setForm({ ...form, qtdRepeticoes: e.target.value })}
                      onBlur={handleBlur}
                      placeholder="Ex: 10"
                    />
                  </label>
                )}
                {form.termino === 'data' && (
                  <label className="colaborador-label">Data de término
                    <input
                      className={`colaborador-input-modern${(touched['dataTermino'] && !form.dataTermino) ? ' obrigatorio-vazio' : ''}`}
                      type="date"
                      name="dataTermino"
                      value={form.dataTermino || ''}
                      onChange={e => setForm({ ...form, dataTermino: e.target.value })}
                      onBlur={handleBlur}
                    />
                  </label>
                )}
              </div>
              <button className="colaborador-btn-modern" type="submit" style={{marginTop: 32}} onClick={() => setTouched(prev => ({...prev, criador: true, responsaveis: true, periodoDias: true, diasSemana: true, diasMes: true, qtdRepeticoes: true, dataTermino: true}))}>Enviar</button>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

export default App;
