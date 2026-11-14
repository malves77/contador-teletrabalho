import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App'

describe('Aplicação Contador de Teletrabalho (UI)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renderiza o cabeçalho, o botão Estou no escritório e os 4 cartões de saldo', () => {
    render(<App />)

    // Título da app
    expect(screen.getByText('Contador de Teletrabalho')).toBeInTheDocument()

    // 4 cartões de saldo
    expect(screen.getByText('Dias usados')).toBeInTheDocument()
    expect(screen.getByText('Dias planeados')).toBeInTheDocument()
    expect(screen.getByText('Saldo atual')).toBeInTheDocument()
    expect(screen.getByText('Saldo após plano')).toBeInTheDocument()

    // Botões principais
    expect(screen.getByText('Distribuir dias restantes')).toBeInTheDocument()
    expect(screen.getByText('Marcar férias')).toBeInTheDocument()
    expect(screen.getByText('Definições')).toBeInTheDocument()
  })

  it('abre o modal de definições e permite fechar', () => {
    render(<App />)

    const settingsBtn = screen.getByText('Definições')
    fireEvent.click(settingsBtn)

    expect(screen.getByText('Definições da Aplicação')).toBeInTheDocument()
    expect(screen.getByText('Quota de Teletrabalho por Semestre')).toBeInTheDocument()

    // Fechar pelo botão Cancelar
    const cancelBtn = screen.getByText('Cancelar')
    fireEvent.click(cancelBtn)

    expect(screen.queryByText('Definições da Aplicação')).not.toBeInTheDocument()
  })

  it('abre o modal de marcar férias', () => {
    render(<App />)

    const vacationBtn = screen.getByText('Marcar férias')
    fireEvent.click(vacationBtn)

    expect(screen.getByRole('heading', { name: 'Marcar Férias' })).toBeInTheDocument()
    expect(screen.getByText('Data de início')).toBeInTheDocument()
    expect(screen.getByText('Data de fim')).toBeInTheDocument()
  })
})
