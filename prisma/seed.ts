import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar usuários
  const adminUser = await prisma.user.create({
    data: {
      email: 'luciano.filho@unimedcaruaru.com.br',
      name: 'Luciano Filho',
      password: await bcrypt.hash('Mudar@123', 12),
      role: 'ADMIN',
      sector: 'TI',
      branch: 'Matriz',
      phone: '(87) 99999-9999',
      lecomUsername: 'luciano.filho',
      canOpenTicketsForOthers: true,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'edwa.favre@hospitalunimedcaruaru.com.br',
      name: 'Edwa Favre',
      password: await bcrypt.hash('123456', 12),
      role: 'MEMBER',
      sector: 'TI',
      branch: 'Hospital',
      phone: '(87) 88888-8888',
      lecomUsername: 'edwa.favre',
    },
  })

  const user3 = await prisma.user.create({
    data: {
      email: 'marcos.barreto@unimedcaruaru.com.br',
      name: 'Marcos Barreto',
      password: await bcrypt.hash('123456', 12),
      role: 'TEAM_LEADER',
      sector: 'TI',
      branch: 'Matriz',
      phone: '(87) 77777-7777',
      lecomUsername: 'marcos.barreto',
    },
  })

  // Criar equipes
  const teamServiceDesk = await prisma.team.create({
    data: {
      name: 'Service Desk Operadora',
      description: 'Equipe responsável pelo atendimento de primeiro nível',
    },
  })

  const teamNTI = await prisma.team.create({
    data: {
      name: 'NTI Lideranças',
      description: 'Núcleo de Tecnologia da Informação - Lideranças',
    },
  })

  // Adicionar membros às equipes
  await prisma.teamMember.createMany({
    data: [
      { userId: adminUser.id, teamId: teamServiceDesk.id, role: 'MEMBER' },
      { userId: adminUser.id, teamId: teamNTI.id, role: 'LEADER' },
      { userId: user2.id, teamId: teamServiceDesk.id, role: 'MEMBER' },
      { userId: user3.id, teamId: teamNTI.id, role: 'MEMBER' },
    ],
  })

  // Criar quadros
  const boardServiceDesk = await prisma.board.create({
    data: {
      name: 'Quadro Service Desk',
      description: 'Gerenciamento de demandas do Service Desk',
      teamId: teamServiceDesk.id,
    },
  })

  const boardNTI = await prisma.board.create({
    data: {
      name: 'Quadro NTI',
      description: 'Projetos e demandas estratégicas de TI',
      teamId: teamNTI.id,
    },
  })

  // Criar colunas padrão
  const defaultColumns = [
    { name: 'Backlog', position: 0 },
    { name: 'Em Andamento', position: 1 },
    { name: 'Em Revisão', position: 2 },
    { name: 'Concluído', position: 3 },
  ]

  for (const board of [boardServiceDesk, boardNTI]) {
    await prisma.column.createMany({
      data: defaultColumns.map(col => ({
        ...col,
        boardId: board.id,
      })),
    })
  }

  // Adicionar membros aos quadros
  await prisma.boardMember.createMany({
    data: [
      { userId: adminUser.id, boardId: boardServiceDesk.id, role: 'ADMIN' },
      { userId: adminUser.id, boardId: boardNTI.id, role: 'ADMIN' },
      { userId: user2.id, boardId: boardServiceDesk.id, role: 'MEMBER' },
      { userId: user3.id, boardId: boardNTI.id, role: 'MEMBER' },
    ],
  })

  // Criar alguns cards de exemplo
  const backlogColumn = await prisma.column.findFirst({
    where: { boardId: boardServiceDesk.id, name: 'Backlog' },
  })

  const inProgressColumn = await prisma.column.findFirst({
    where: { boardId: boardServiceDesk.id, name: 'Em Andamento' },
  })

  if (backlogColumn && inProgressColumn) {
    const card1 = await prisma.card.create({
      data: {
        title: 'Configurar novo computador para funcionário',
        description: 'Instalar sistema operacional, programas básicos e configurar acesso à rede',
        columnId: backlogColumn.id,
        boardId: boardServiceDesk.id,
        creatorId: adminUser.id,
        assigneeId: user2.id,
        position: 0,
        priority: 'MEDIUM',
        urgency: 'NOT_URGENT',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    })

    const card2 = await prisma.card.create({
      data: {
        title: 'Problema crítico no servidor de email',
        description: 'Usuários relatam que não conseguem enviar emails. Investigar e resolver urgentemente.',
        columnId: inProgressColumn.id,
        boardId: boardServiceDesk.id,
        creatorId: user2.id,
        assigneeId: adminUser.id,
        position: 0,
        priority: 'HIGH',
        urgency: 'URGENT',
        highImpact: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 horas
      },
    })

    const card3 = await prisma.card.create({
      data: {
        title: 'Implementação do novo sistema de gestão',
        description: 'Projeto para implementar o novo ERP da empresa',
        columnId: backlogColumn.id,
        boardId: boardNTI.id,
        creatorId: adminUser.id,
        assigneeId: user3.id,
        position: 0,
        priority: 'HIGH',
        urgency: 'NOT_URGENT',
        isProject: true,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 dias
      },
    })

    // Criar checklists para os cards
    await prisma.checklistItem.createMany({
      data: [
        { cardId: card1.id, title: 'Instalar Windows 11', position: 0 },
        { cardId: card1.id, title: 'Instalar Office 365', position: 1 },
        { cardId: card1.id, title: 'Configurar acesso à rede', position: 2 },
        { cardId: card1.id, title: 'Instalar antivírus', position: 3 },
        { cardId: card2.id, title: 'Verificar logs do servidor', position: 0, completed: true },
        { cardId: card2.id, title: 'Reiniciar serviço de email', position: 1 },
        { cardId: card2.id, title: 'Testar envio de emails', position: 2 },
      ],
    })

    // Criar projeto para o card3
    await prisma.project.create({
      data: {
        cardId: card3.id,
        methodology: 'PMI',
        notes: 'Projeto estratégico para modernização dos sistemas da empresa',
      },
    })
  }

  console.log('Seed executado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })