import { useState, useEffect, useCallback } from 'react';
import'./App.css';
import type { User } from '../../types/setup';

// ローディングスピナーコンポーネント
const Spinner = () => <div className="spinner"></div>;

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [netStatus, setNetStatus] = useState<boolean>(true);
  const [eucCode, setEucCode] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [isBrowserOpen, setIsBrowserOpen] = useState(false);
  const [isCredentialSaved, setIsCredentialSaved] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const addLog = useCallback((log: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${log}`, ...prev]); // 新しいログを上に追加
  }, []);

  useEffect(() => {
    const cleanupLog = window.ipc.onLogAdd(addLog);
    const cleanupNet = window.ipc.onNetworkStatusChange((status) => {
      setNetStatus(status);
      addLog(`ネットワーク状態: ${status ? 'オンライン' : 'オフライン'}`);
    });
    const cleanupBrowser = window.ipc.onBrowserStatusChange(({ isOpen }) => {
      setIsBrowserOpen(isOpen);
    });

    window.ipc.startNetworkMonitoring();
    window.ipc.loadCredentials().then(user => {
      setIsCredentialSaved(!!user);
      addLog(user ? 'ログイン情報を読み込みました。' : 'ログイン情報が設定されていません。');
    });

    return () => {
      cleanupLog();
      cleanupNet();
      cleanupBrowser();
      window.ipc.stopNetworkMonitoring();
    };
  }, [addLog]);

  const handleOperation = async (operation: () => Promise<any>, requireCredentials = true) => {
    if (requireCredentials && !isCredentialSaved) {
      addLog('エラー: ログイン情報が設定されていません。');
      alert('ログイン情報を先に設定してください。');
      return;
    }

    setIsLoading(true);
    try {
      await operation();
    } catch (error: any) {
      addLog(`エラー発生: ${error.message}`);
      alert(`エラーが発生しました:\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCredentials = async () => {
    if (!username || !password) {
      alert('ユーザーIDとパスワードを入力してください。');
      return;
    }
    const user: User = { username, password };
    await handleOperation(async () => {
      await window.ipc.saveCredentials(user);
      setIsCredentialSaved(true);
      setIsModalOpen(false);
      setUsername('');
      setPassword('');
      addLog('ログイン情報を保存しました。');
    }, false);
  };

  useEffect(() => {
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
      logContainer.scrollTop = logContainer.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`App ${isLoading ? 'loading' : ''}`}>
      <header className="App-header">
        <h1>大学ポータル自動化アプリ</h1>
        <div className={`status-indicator ${netStatus ? 'online' : 'offline'}`}>
          {netStatus ? 'オンライン' : 'オフライン'}
        </div>
      </header>

      <main className="App-main">
        <div className="card">
          <h2><span className="emoji">🔑</span>認証設定</h2>
          <p>
            現在の状態:
            <span className={isCredentialSaved ? 'status-ok' : 'status-ng'}>
              {isCredentialSaved ? '設定済み' : '未設定'}
            </span>
          </p>
          <button onClick={() => setIsModalOpen(true)}>ログイン情報を設定</button>
        </div>

        <div className="card">
          <h2><span className="emoji">🌐</span>ポータルサイト</h2>
          <p>S-CLASSやSOLAのページをAppモードで開きます。</p>
          <div className="button-group">
            <button onClick={() => handleOperation(window.ipc.sclassOpen)} disabled={isBrowserOpen}>S-CLASSを開く</button>
            <button onClick={() => handleOperation(window.ipc.solaOpen)} disabled={isBrowserOpen}>SOLAを開く</button>
          </div>
          <button onClick={() => handleOperation(window.ipc.persistentClose, false)} disabled={!isBrowserOpen} className="danger">ブラウザを閉じる</button>
        </div>

        <div className="card">
          <h2><span className="emoji">🚀</span>バックグラウンド処理</h2>
          <p>以下の処理は画面に表示されずに実行されます。</p>
          <div className="input-group">
            <input type="text" value={eucCode} onChange={(e) => setEucCode(e.target.value)} placeholder="EUCコード"/>
            <button onClick={() => handleOperation(() => window.ipc.eucRegister(eucCode))}>EUC登録実行</button>
          </div>
          <button onClick={() => handleOperation(window.ipc.createSolaLinkData)}>履修データ生成</button>
        </div>
      </main>

      <footer className="App-footer">
        <h2><span className="emoji">📋</span>実行ログ</h2>
        <div id="log-container" className="log-container">
          {logs.map((log, index) => (
            <div key={index} className="log-item">{log}</div>
          ))}
        </div>
      </footer>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>ログイン情報の設定</h2>
            <p>情報はPC内に安全に保存されます。</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ユーザーID (学籍番号)"
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              autoComplete="current-password"
            />
            <div className="modal-actions">
              <button onClick={saveCredentials} className="primary">保存</button>
              <button onClick={() => setIsModalOpen(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}
      {isLoading && <div className="loading-overlay"><Spinner /></div>}
    </div>
  );
}

export default App;
