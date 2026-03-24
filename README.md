# iPad Camp Fire

CIRCUS TOKYO（3/27）でのクラブイベント演出用Webアプリケーション。
20台のiPadで動作し、超音波信号によって画面表示を同期的に切り替える参加型映像演出システム。

## セットアップ

```bash
npm install
```

### 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 で表示ページ、http://localhost:3000/control でコントロールUIが開く。

### プロダクションビルド

```bash
npm run build
npm start
```

## ページ構成

| パス | 用途 |
|------|------|
| `/` | 表示ページ（iPadで開く） |
| `/control` | コントロールUI（モード切替操作用） |

## 表示ページ (`/`)

### クエリパラメータ

各iPadに異なるIDを付与して開く。

```
/?id=0
/?id=1
...
/?id=19
```

IDはモード8（Sin波トランジション）で端末ごとの位相差に使用される。
デバッグパネルのテンキーからも変更可能。

### 画面モード（8種）

キーボード 1-8 で切替。切替時は800msのクロスフェード。

| キー | モード | 内容 |
|------|--------|------|
| 1 | カメラ+サーモ | 端末カメラ映像にサーモグラフィシェーダー（WebGL）を適用。コントラスト強調、白方向の色斑+グレインノイズ重畳 |
| 2 | カメラ+フラッシュ | 端末カメラ映像をランダム周期（0.5-3秒）でホワイトアウト。イーズイン/アウト付き |
| 3 | VJ映像+サーモ | VJ映像にサーモグラフィシェーダーを適用 |
| 4 | VJ映像+フラッシュ | VJ映像にホワイトアウトフラッシュを適用 |
| 5 | 白単色 | 画面全体を白 |
| 6 | 赤単色 | 赤ベースにfbmノイズ+グレイン粒子による炎のようなテクスチャ（WebGL） |
| 7 | 黒単色 | 画面全体を黒（初期状態） |
| 8 | Sin波トランジション | `?id=N` に基づく位相差で白⇔赤をsin関数で滑らかに遷移 |

### 映像ソース

- **カメラ**: 背面カメラ（`facingMode: 'environment'`）。初回のクリックまたはキー入力で自動取得
- **VJ映像**: `public/dummy-video.mp4` をループ再生。本番ではWebRTC経由のライブ映像に差し替え予定

映像はobject-fit: cover相当の処理で描画される（アスペクト比を維持し、キャンバスを完全に覆う）。

### デバッグパネル

画面右下をダブルクリック（ダブルタップ）で表示/非表示。✕ボタンで閉じることも可能。

- 現在のMode番号とDevice IDの表示
- テンキーによるDevice ID設定（入力後「設定」ボタンで確定）

## コントロールページ (`/control`)

モード切替用のUI。同一ネットワーク上のPC/タブレットから操作する。

### 信号の伝送方式

2つの伝送方式を同時に使用可能。

#### BroadcastChannel（同一オリジン）

同じブラウザ上の別タブで開いた表示ページにモード切替を即時送信。開発時に便利。

#### 超音波信号（ASP-system互換）

18kHz帯の超音波をスピーカーから発信し、iPadのマイクで受信してモードを切り替える。

- チェックボックス「超音波送信」で有効化（デフォルトOFF）
- Gain（音量）とDuration（信号長）をスライダーで調整可能
- 「停止」ボタンで信号送信を停止

超音波受信は表示ページ側で `useSignal` フックの `audioEnabled` を有効にする必要がある（現在はデフォルトOFF）。

## 技術スタック

- Next.js 16.2.1（App Router）
- React 19
- WebGL / GLSLシェーダー
- Web Audio API（超音波送受信）
- getUserMedia（カメラ・マイク）

## ディレクトリ構成

```
app/
├── layout.tsx              # ルートレイアウト
├── page.tsx                # 表示ページエントリ
├── globals.css             # フルスクリーン黒背景
├── control/
│   └── page.tsx            # コントロールUI
├── _components/
│   ├── App.tsx             # クライアントルート
│   ├── ModeRenderer.tsx    # クロスフェード管理
│   ├── CameraSource.tsx    # カメラストリーム
│   ├── VideoSource.tsx     # VJ映像
│   ├── DebugPanel.tsx      # デバッグパネル
│   └── modes/
│       ├── ThermoMode.tsx  # サーモシェーダー（WebGL）
│       ├── FlashMode.tsx   # ホワイトアウトフラッシュ
│       ├── SolidColor.tsx  # 単色
│       ├── RedGrain.tsx    # 赤+グレイン（WebGL）
│       └── SinWaveMode.tsx # Sin波トランジション
├── _shaders/
│   ├── thermo.vert.ts      # 頂点シェーダー
│   ├── thermo.frag.ts      # サーモフラグメントシェーダー
│   └── redGrain.frag.ts    # 赤グレインシェーダー
├── _hooks/
│   ├── useSignal.ts        # モード切替（キーボード/BroadcastChannel/超音波）
│   ├── useCamera.ts        # カメラストリーム管理
│   ├── useQueryId.ts       # Device ID管理
│   └── useAudioReceiver.ts # 超音波受信
└── _lib/
    ├── webgl.ts            # WebGLユーティリティ（cover描画含む）
    ├── transition.ts       # クロスフェード定数
    ├── modes.ts            # モード定義（共通）
    ├── audioSignal.ts      # 超音波プロトコル設定
    └── audioSender.ts      # 超音波送信クラス
```
