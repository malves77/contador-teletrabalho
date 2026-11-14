import { describe, it, expect } from 'vitest'
import { getOfficialHolidaysForYear, getEasterDate, getHolidayOrClosureInfo } from '../utils/holidays'

describe('Feriados Oficiais e Encerramentos', () => {
  it('calcula a Páscoa e os feriados móveis corretamente para 2026', () => {
    const easter = getEasterDate(2026)
    // Páscoa em 2026 é 5 de abril
    expect(easter).toEqual({ month: 4, day: 5 })

    const holidays2026 = getOfficialHolidaysForYear(2026)

    // Feriados móveis
    expect(holidays2026['2026-02-17']).toBe('Carnaval')
    expect(holidays2026['2026-04-03']).toBe('Sexta-feira Santa')
    expect(holidays2026['2026-04-05']).toBe('Páscoa')
    expect(holidays2026['2026-06-04']).toBe('Corpo de Deus')

    // Feriado Municipal de Lisboa (13 de junho)
    expect(holidays2026['2026-06-13']).toBe('Santo António (Feriado de Lisboa)')

    // Feriados Nacionais fixos
    expect(holidays2026['2026-01-01']).toBe('Ano Novo')
    expect(holidays2026['2026-04-25']).toBe('Dia da Liberdade')
    expect(holidays2026['2026-05-01']).toBe('Dia do Trabalhador')
    expect(holidays2026['2026-06-10']).toBe('Dia de Portugal')
    expect(holidays2026['2026-08-15']).toBe('Assunção de Nossa Senhora')
    expect(holidays2026['2026-10-05']).toBe('Implantação da República')
    expect(holidays2026['2026-11-01']).toBe('Todos os Santos')
    expect(holidays2026['2026-12-01']).toBe('Restauração da Independência')
    expect(holidays2026['2026-12-08']).toBe('Imaculada Conceição')
    expect(holidays2026['2026-12-25']).toBe('Natal')
  })

  it('suporta feriados adicionais e dias de encerramento personalizados', () => {
    const custom = [
      { id: '1', date: '2026-07-24', name: 'Ponte da Empresa', type: 'closure' as const },
      { id: '2', date: '2026-09-08', name: 'Feriado Local', type: 'holiday' as const },
    ]

    const info1 = getHolidayOrClosureInfo('2026-07-24', custom)
    expect(info1.isClosure).toBe(true)
    expect(info1.closureName).toBe('Ponte da Empresa')

    const info2 = getHolidayOrClosureInfo('2026-09-08', custom)
    expect(info2.isHoliday).toBe(true)
    expect(info2.holidayName).toBe('Feriado Local')
  })
})
