import {
  Archive,
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  EyeOff,
  FileDown,
  FileText,
  FolderOpen,
  Home,
  Link2,
  ListChecks,
  Megaphone,
  Pin,
  Receipt,
  Repeat,
  Search,
  ShieldCheck,
  Tags,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

/**
 * Fonte única das funcionalidades: alimenta os cards da home e as páginas
 * /funcionalidades/[slug]. O conteúdo descreve só o que o app faz hoje; os
 * módulos "em breve" descrevem o que está planejado, sem prazo.
 */
export type Funcionalidade = {
  slug: string;
  Icone: LucideIcon;
  titulo: string;
  resumo: string;
  pronto: boolean;
  subtitulo: string;
  descricao: string;
  passos: { titulo: string; texto: string }[];
  recursos: { Icone: LucideIcon; titulo: string; texto: string }[];
  sindico: string[];
  morador: string[];
};

export const FUNCIONALIDADES: Funcionalidade[] = [
  {
    slug: "comunicados",
    Icone: Megaphone,
    titulo: "Comunicados",
    resumo: "Avisos do síndico com destaque, fixados e controle de leitura por casa.",
    pronto: true,
    subtitulo: "Os avisos do condomínio chegam a todos, ficam registrados e o síndico sabe quem já leu.",
    descricao: "Comunicados da Zelora: avisos do síndico para os moradores, com destaque, fixação e controle de leitura por casa.",
    passos: [
      { titulo: "O síndico escreve", texto: "Título, categoria e texto, com formatação simples como negrito, listas e links." },
      { titulo: "Define o destaque", texto: "Marca o aviso como importante e/ou fixa no topo da lista." },
      { titulo: "Os moradores leem", texto: "O comunicado aparece como não lido até ser aberto, e a leitura fica registrada." },
      { titulo: "O síndico acompanha", texto: "Cada comunicado mostra em quantas casas pelo menos um morador já leu." },
    ],
    recursos: [
      { Icone: Tags, titulo: "Categorias", texto: "Geral, manutenção, assembleia, segurança e eventos." },
      { Icone: Pin, titulo: "Fixados e importantes", texto: "Avisos fixados aparecem primeiro, e os importantes ganham destaque." },
      { Icone: Bell, titulo: "Indicador de não lido", texto: "Cada morador vê o que ainda não abriu." },
      { Icone: ListChecks, titulo: "Leitura por casa", texto: "O síndico vê quantas casas já leram cada aviso." },
      { Icone: Search, titulo: "Busca e filtro", texto: "Encontre avisos antigos por palavra ou por categoria." },
    ],
    sindico: ["Publica, edita e fixa comunicados.", "Marca avisos como importantes.", "Acompanha a leitura por casa."],
    morador: ["Lê os avisos no celular ou no computador.", "Vê o que ainda não leu.", "Busca comunicados anteriores."],
  },
  {
    slug: "reservas",
    Icone: CalendarDays,
    titulo: "Reservas",
    resumo: "Calendário do salão e de outros espaços, com regras e sem conflito de datas.",
    pronto: true,
    subtitulo: "Reserve o salão e os demais espaços do condomínio em um calendário, sem dois moradores no mesmo dia.",
    descricao: "Reservas da Zelora: calendário dos espaços do condomínio com regras de uso e sem conflito de datas.",
    passos: [
      { titulo: "Escolha o espaço", texto: "Cada espaço tem o seu calendário mensal." },
      { titulo: "Toque no dia livre", texto: "Dias já reservados aparecem ocupados, com a casa que reservou." },
      { titulo: "Confirme a reserva", texto: "A Zelora confere as regras do espaço antes de confirmar." },
      { titulo: "Gerencie a reserva", texto: "O morador pode excluir suas reservas de datas futuras." },
    ],
    recursos: [
      { Icone: CalendarCheck, titulo: "Sem conflito de datas", texto: "O mesmo dia (ou período) não pode ser reservado duas vezes." },
      { Icone: CalendarDays, titulo: "Dia inteiro ou por período", texto: "Cada espaço funciona por dia inteiro ou por períodos definidos." },
      { Icone: CalendarOff, titulo: "Dias bloqueados", texto: "Datas indisponíveis ficam bloqueadas para reserva." },
      { Icone: ListChecks, titulo: "Regras por espaço", texto: "Antecedência mínima e máxima e limite mensal de reservas por casa." },
      { Icone: FileText, titulo: "Regras e capacidade", texto: "Cada espaço pode exibir suas regras de uso e capacidade." },
    ],
    sindico: ["Reserva em nome de qualquer casa.", "Exclui qualquer reserva.", "Não fica sujeito aos limites de antecedência e de reservas por mês."],
    morador: ["Reserva para a sua casa.", "Vê o calendário e as próximas reservas.", "Exclui as reservas que criou, enquanto a data não passou."],
  },
  {
    slug: "moradores",
    Icone: Users,
    titulo: "Moradores",
    resumo: "Cadastro por link de convite, aprovação do síndico e transferência de casa.",
    pronto: true,
    subtitulo: "Só entra quem o síndico aprova: cadastro por convite, controle de titulares e mudanças de casa.",
    descricao: "Moradores na Zelora: cadastro por link de convite, aprovação do síndico e transferência de casa.",
    passos: [
      { titulo: "O síndico gera o convite", texto: "Um link do condomínio, com validade opcional, que pode ser revogado." },
      { titulo: "O morador se cadastra", texto: "Escolhe a casa e informa se é titular, vai morar junto ou se a casa mudou de morador." },
      { titulo: "O síndico analisa", texto: "Aprova ou recusa (com motivo) cada pedido pendente." },
      { titulo: "Acesso liberado", texto: "Aprovado, o morador passa a ver o conteúdo do condomínio." },
    ],
    recursos: [
      { Icone: Link2, titulo: "Link de convite", texto: "Gere, copie e revogue o link do condomínio." },
      { Icone: UserCheck, titulo: "Aprovação do síndico", texto: "Ninguém entra sem aprovação, e tudo fica registrado." },
      { Icone: Home, titulo: "Titular e co-moradores", texto: "Cada casa tem um titular e pode ter outros moradores." },
      { Icone: Repeat, titulo: "Mudança de casa", texto: "O morador pede a mudança pelo perfil, e o síndico aprova." },
      { Icone: EyeOff, titulo: "Privacidade", texto: "Moradores não veem contatos dos vizinhos." },
      { Icone: Archive, titulo: "Desativação", texto: "O síndico desativa quem saiu e vê as reservas pendentes dessa pessoa." },
    ],
    sindico: ["Gera e revoga o link de convite.", "Aprova ou recusa cadastros e transferências.", "Desativa moradores que saíram."],
    morador: ["Cadastra-se pelo link, sem precisar de planilhas.", "Pede mudança de casa pelo perfil.", "Tem os dados vistos só por quem precisa."],
  },
  {
    slug: "documentos",
    Icone: FileText,
    titulo: "Documentos",
    resumo: "Convenção, regimento, atas e contratos sempre à mão.",
    pronto: false,
    subtitulo: "Em desenvolvimento: os documentos oficiais do condomínio reunidos em um só lugar.",
    descricao: "Documentos na Zelora (em breve): convenção, regimento, atas e contratos do condomínio sempre à mão.",
    passos: [
      { titulo: "O síndico envia", texto: "Envio do arquivo com título, categoria e data de referência." },
      { titulo: "Organização por categoria", texto: "Convenção, regimento interno, atas de assembleia, prestação de contas, contratos e outros." },
      { titulo: "Moradores consultam", texto: "Os moradores do condomínio acessam os documentos pelo celular." },
    ],
    recursos: [
      { Icone: FolderOpen, titulo: "Categorias", texto: "Documentos separados por tipo." },
      { Icone: FileDown, titulo: "Download", texto: "Acesso ao arquivo original." },
      { Icone: ShieldCheck, titulo: "Acesso restrito", texto: "Só quem faz parte do condomínio acessa." },
    ],
    sindico: ["Envia e organiza os documentos.", "Mantém atas e contratos atualizados."],
    morador: ["Consulta convenção e regimento quando precisar.", "Acessa atas de assembleia anteriores."],
  },
  {
    slug: "prestacao-de-contas",
    Icone: Wallet,
    titulo: "Prestação de contas",
    resumo: "Despesas por categoria, comparativos e exportação para assembleia.",
    pronto: false,
    subtitulo: "Em desenvolvimento: as despesas do condomínio organizadas e transparentes para todos.",
    descricao: "Prestação de contas na Zelora (em breve): despesas por categoria, comparativos e exportação para assembleia.",
    passos: [
      { titulo: "O síndico lança", texto: "Data, categoria, descrição, valor e comprovante opcional." },
      { titulo: "A Zelora organiza", texto: "Despesas agrupadas por categoria, como água, energia, limpeza e manutenção." },
      { titulo: "Moradores acompanham", texto: "Os moradores consultam para onde vai o dinheiro do condomínio." },
    ],
    recursos: [
      { Icone: Receipt, titulo: "Lançamento de despesas", texto: "Com comprovante anexado." },
      { Icone: Tags, titulo: "Categorias", texto: "Despesas separadas por tipo." },
      { Icone: BarChart3, titulo: "Comparativos", texto: "Planejado: comparação entre períodos." },
      { Icone: FileDown, titulo: "Exportação", texto: "Planejado: relatório para apresentar em assembleia." },
    ],
    sindico: ["Lança as despesas e comprovantes.", "Prepara a prestação de contas para a assembleia."],
    morador: ["Acompanha as despesas do condomínio.", "Consulta o histórico por categoria."],
  },
];

export function buscarFuncionalidade(slug: string) {
  return FUNCIONALIDADES.find((f) => f.slug === slug);
}
