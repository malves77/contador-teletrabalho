# Contador de Teletrabalho

Aplicação web moderna para controlo de quotas semestrais de teletrabalho e registo rápido de presenças em escritório em Lisboa.

Desenvolvida com **React**, **Vite**, **TypeScript** e **Tailwind CSS**, sem necessidade de conta ou backend (todos os dados e preferências são guardados localmente no `localStorage`).

---

## Funcionalidades Principais

1. **Registo de escritório com um toque («Estou no escritório»):**
   - No topo do ecrã inicial, junto ao resumo de saldo (visível em desktop e mobile mesmo ao navegar noutro mês).
   - Regista imediatamente a data de hoje em Lisboa com opção de **Desfazer** para repor o estado anterior.
   - Deteta fins de semana, feriados oficiais e encerramentos, desativando o botão em dias não úteis.
   - Pede confirmação antes de substituir dias marcados como férias.
   - Substitui teletrabalho e recalcula o saldo devolvendo o dia.

2. **Resumo do Saldo Semestral (4 Indicadores):**
   - **Dias usados:** Saldo inicial (com data de corte) + teletrabalho até hoje não incluído no saldo inicial.
   - **Dias planeados:** Registos de teletrabalho com data posterior a hoje.
   - **Saldo atual:** Quota menos dias usados.
   - **Saldo após o plano:** Saldo atual menos dias planeados.
   - Alerta visual quando a quota é ultrapassada indicando o número de dias excedentes.

3. **Calendário Mensal & Semestral:**
   - Semestres civis: 1º Semestre (Jan - Jun) e 2º Semestre (Jul - Dez) com saldos independentes.
   - Feriados nacionais de Portugal (incluindo cálculo dinâmico da Páscoa, Carnaval, Sexta-feira Santa e Corpo de Deus) e o feriado municipal de Lisboa (**13 de junho**).
   - Distinção visual entre dias sem registo, fins de semana, feriados, encerramentos da empresa, escritório, teletrabalho e férias.
   - Marcação de férias para um intervalo de datas de uma só vez.

4. **Algoritmo de «Distribuir dias restantes»:**
   - Procura dias elegíveis entre amanhã e o fim do semestre (ou desde o início do semestre num semestre futuro).
   - Exclui fins de semana, feriados, encerramentos, férias, dias habituais de escritório (ex.: Segunda e Quinta) e dias já registados.
   - Distribui o saldo disponível pelas semanas de forma uniforme (round-robin).
   - Mostra pré-visualização com aviso de dias por usar caso faltem datas elegíveis.
   - Aplica apenas após confirmação e previne duplicações ou substituição de registos manuais.

5. **Área de Definições:**
   - Quota semestral de teletrabalho (padrão: 60 dias).
   - Dias habituais de escritório (padrão: Segunda e Quinta-feira).
   - Saldo inicial com data de corte por semestre (inclui o dia de corte e soma apenas os registos posteriores).
   - Gestão de feriados adicionais e dias de encerramento da empresa.

---

## Como Correr Localmente

### Pré-requisitos
- Node.js (v18+)
- npm ou pnpm

### Instalação
```bash
npm install
```

### Executar em Desenvolvimento
```bash
npm run dev
```
Abre a aplicação em [http://localhost:5173](http://localhost:5173).

### Correr Testes Automáticos
```bash
npm test
```

### Verificar Linter
```bash
npm run lint
```

### Compilar para Produção (Vercel Ready)
```bash
npm run build
```
O build estático gerado na pasta `dist/` fica imediatamente pronto para publicar na Vercel (ou qualquer alojamento de SPA estática).
