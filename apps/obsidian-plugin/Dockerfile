# Playwrightの公式Dockerイメージを使用
FROM mcr.microsoft.com/playwright:v1.44.1-jammy

# 環境変数を設定
ENV DEBIAN_FRONTEND=noninteractive
ENV CI=true
# CI環境であることを明示し、pnpmのTTY関連エラーを回避

# 必要なライブラリとツールをインストール
RUN apt-get update && apt-get install -y \
    wget \
    fuse \
    libgtk-3-0 \
    libnss3 \
    libasound2 \
    libxtst6 \
    libxss1 \
    libsecret-1-0 \
    --no-install-recommends

# Obsidian AppImageをダウンロードして実行可能にする
RUN wget https://github.com/obsidianmd/obsidian-releases/releases/download/v1.9.12/Obsidian-1.9.12.AppImage -O /usr/local/bin/obsidian \
    && chmod +x /usr/local/bin/obsidian

# 作業ディレクトリを設定
WORKDIR /app

# --- モノレポ対応の修正 ---
# 1. 最初に pnpm-workspace.yaml とルートの package.json をコピー
COPY pnpm-workspace.yaml package.json ./

# 2. 全ワークスペースの package.json をコピーして依存関係を解決できるようにする
#    pnpm install が依存関係を解決するためにこれらが必要
COPY apps/obsidian-plugin/package.json ./apps/obsidian-plugin/
COPY packages/ui/package.json ./packages/ui/
COPY packages/libch/package.json ./packages/libch/
COPY configs/esbuild-config/package.json ./configs/esbuild-config/
COPY configs/typescript-config/package.json ./configs/typescript-config/

# 3. pnpm-lock.yaml もルートにコピーされていることを確認
COPY pnpm-lock.yaml ./

# 4. 依存関係をインストール
#    `npm install -g pnpm` の後に、ルートの `node_modules` を作成します。
#    `--unsafe-perm=true` は、npm/pnpmがNode.jsのフックでパーミッションの問題を起こす場合に対処
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile --unsafe-perm=true

# Playwright CLI ツールは `pnpm install` でインストールされる `@playwright/test` パッケージに含まれるため、
# ここで `pnpm add -g playwright` は不要になります。
# PlaywrightのCLIは、`/app/node_modules/.bin` または PNPM_HOME にシンボリックリンクされます。

# PNPM_HOME 環境変数を設定し、PATH に追加
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:/app/node_modules/.bin:${PATH}"
# /app/node_modules/.bin をPATHの早い段階に追加

# 5. プロジェクトのソースコード全体をコピー
COPY . .

# 6. obsidian-plugin ディレクトリに移動
WORKDIR /app/apps/obsidian-plugin

# 7. `@playwright/test` が含まれるプロジェクトの依存関係をインストール
#    このステップで、プラグイン固有の依存関係を解決し、`@playwright/test` が確実に利用可能になるようにします。
#    `--no-frozen-lockfile` は、モノレポのルートに `pnpm-lock.yaml` があり、
#    サブプロジェクトの `node_modules` を個別に管理しない pnpm の挙動に対応
RUN pnpm install --no-frozen-lockfile --unsafe-perm=true

# テスト実行時のデフォルトコマンドを修正
CMD ["pnpm", "exec", "playwright", "test"]
