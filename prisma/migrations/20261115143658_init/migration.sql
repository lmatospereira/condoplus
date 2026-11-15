-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('SINDICO', 'MORADOR');

-- CreateEnum
CREATE TYPE "TipoMorador" AS ENUM ('TITULAR', 'COMORADOR');

-- CreateEnum
CREATE TYPE "StatusVinculo" AS ENUM ('PENDENTE', 'ATIVO', 'RECUSADO', 'INATIVO');

-- CreateEnum
CREATE TYPE "CategoriaComunicado" AS ENUM ('GERAL', 'MANUTENCAO', 'ASSEMBLEIA', 'SEGURANCA', 'EVENTOS');

-- CreateEnum
CREATE TYPE "ModoReserva" AS ENUM ('DIA_INTEIRO', 'PERIODOS');

-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('CONVENCAO', 'REGIMENTO_INTERNO', 'ATAS_ASSEMBLEIA', 'PRESTACAO_CONTAS', 'CONTRATOS', 'OUTROS');

-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('AGUA', 'ENERGIA', 'LIMPEZA', 'JARDINAGEM', 'MANUTENCAO', 'SEGURANCA', 'ADMINISTRACAO', 'SEGURO', 'OBRAS', 'MATERIAL', 'IMPOSTOS_TAXAS', 'OUTROS');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "telefone" TEXT,
    "isMaster" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condominio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "cnpj" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Condominio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unidade" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "identificador" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Unidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vinculo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "papel" "Papel" NOT NULL,
    "tipo" "TipoMorador",
    "status" "StatusVinculo" NOT NULL DEFAULT 'PENDENTE',
    "ehTransferencia" BOOLEAN NOT NULL DEFAULT false,
    "aprovadoPorId" TEXT,
    "aprovadoEm" TIMESTAMP(3),
    "motivoRecusa" TEXT,
    "desativadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Convite" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3),
    "revogadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comunicado" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "conteudo" TEXT NOT NULL,
    "categoria" "CategoriaComunicado" NOT NULL DEFAULT 'GERAL',
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "fixado" BOOLEAN NOT NULL DEFAULT false,
    "autorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comunicado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComunicadoAnexo" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "comunicadoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "arquivoKey" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunicadoAnexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComunicadoLeitura" (
    "comunicadoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComunicadoLeitura_pkey" PRIMARY KEY ("comunicadoId","userId")
);

-- CreateTable
CREATE TABLE "Espaco" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "capacidade" INTEGER,
    "regras" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "modo" "ModoReserva" NOT NULL DEFAULT 'DIA_INTEIRO',
    "periodos" TEXT[],
    "antecedenciaMinDias" INTEGER,
    "antecedenciaMaxDias" INTEGER,
    "limiteMensalPorUnidade" INTEGER,
    "diasBloqueados" DATE[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Espaco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reserva" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "espacoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "periodo" TEXT NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "excluidoEm" TIMESTAMP(3),
    "excluidoPorId" TEXT,

    CONSTRAINT "Reserva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" "CategoriaDocumento" NOT NULL,
    "dataReferencia" DATE NOT NULL,
    "arquivoKey" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "enviadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Despesa" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT NOT NULL,
    "data" DATE NOT NULL,
    "categoria" "CategoriaDespesa" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "comprovanteKey" TEXT,
    "comprovanteMime" TEXT,
    "lancadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Despesa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "condominioId" TEXT,
    "userId" TEXT NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT,
    "dados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");

-- CreateIndex
CREATE INDEX "Unidade_condominioId_idx" ON "Unidade"("condominioId");

-- CreateIndex
CREATE UNIQUE INDEX "Unidade_condominioId_identificador_key" ON "Unidade"("condominioId", "identificador");

-- CreateIndex
CREATE INDEX "Vinculo_condominioId_idx" ON "Vinculo"("condominioId");

-- CreateIndex
CREATE INDEX "Vinculo_userId_idx" ON "Vinculo"("userId");

-- CreateIndex
CREATE INDEX "Vinculo_unidadeId_idx" ON "Vinculo"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Convite_token_key" ON "Convite"("token");

-- CreateIndex
CREATE INDEX "Convite_condominioId_idx" ON "Convite"("condominioId");

-- CreateIndex
CREATE INDEX "Comunicado_condominioId_fixado_createdAt_idx" ON "Comunicado"("condominioId", "fixado", "createdAt");

-- CreateIndex
CREATE INDEX "ComunicadoAnexo_condominioId_idx" ON "ComunicadoAnexo"("condominioId");

-- CreateIndex
CREATE INDEX "ComunicadoAnexo_comunicadoId_idx" ON "ComunicadoAnexo"("comunicadoId");

-- CreateIndex
CREATE INDEX "ComunicadoLeitura_userId_idx" ON "ComunicadoLeitura"("userId");

-- CreateIndex
CREATE INDEX "Espaco_condominioId_idx" ON "Espaco"("condominioId");

-- CreateIndex
CREATE INDEX "Reserva_condominioId_data_idx" ON "Reserva"("condominioId", "data");

-- CreateIndex
CREATE INDEX "Reserva_espacoId_data_idx" ON "Reserva"("espacoId", "data");

-- CreateIndex
CREATE INDEX "Reserva_unidadeId_idx" ON "Reserva"("unidadeId");

-- CreateIndex
CREATE INDEX "Documento_condominioId_categoria_idx" ON "Documento"("condominioId", "categoria");

-- CreateIndex
CREATE INDEX "Despesa_condominioId_data_idx" ON "Despesa"("condominioId", "data");

-- CreateIndex
CREATE INDEX "AuditLog_condominioId_createdAt_idx" ON "AuditLog"("condominioId", "createdAt");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unidade" ADD CONSTRAINT "Unidade_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vinculo" ADD CONSTRAINT "Vinculo_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comunicado" ADD CONSTRAINT "Comunicado_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComunicadoAnexo" ADD CONSTRAINT "ComunicadoAnexo_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComunicadoLeitura" ADD CONSTRAINT "ComunicadoLeitura_comunicadoId_fkey" FOREIGN KEY ("comunicadoId") REFERENCES "Comunicado"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComunicadoLeitura" ADD CONSTRAINT "ComunicadoLeitura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Espaco" ADD CONSTRAINT "Espaco_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_espacoId_fkey" FOREIGN KEY ("espacoId") REFERENCES "Espaco"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "Unidade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reserva" ADD CONSTRAINT "Reserva_excluidoPorId_fkey" FOREIGN KEY ("excluidoPorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_enviadoPorId_fkey" FOREIGN KEY ("enviadoPorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Despesa" ADD CONSTRAINT "Despesa_lancadoPorId_fkey" FOREIGN KEY ("lancadoPorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_condominioId_fkey" FOREIGN KEY ("condominioId") REFERENCES "Condominio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- Índices únicos parciais (o Prisma não os gera pelo schema — ver docs/DECISOES.md)
-- ---------------------------------------------------------------------------

-- No máximo uma reserva ATIVA por espaço + data + período.
CREATE UNIQUE INDEX "Reserva_ativa_espaco_data_periodo_key"
  ON "Reserva" ("espacoId", "data", "periodo")
  WHERE "excluidoEm" IS NULL;

-- No máximo um vínculo SINDICO ATIVO por condomínio.
CREATE UNIQUE INDEX "Vinculo_sindico_ativo_condominio_key"
  ON "Vinculo" ("condominioId")
  WHERE "papel" = 'SINDICO' AND "status" = 'ATIVO';
