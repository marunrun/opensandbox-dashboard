"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  Activity,
  FileSearch,
  Gauge,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCw,
  Search,
  Terminal,
  Trash2,
} from "lucide-react";
import { clsx } from "clsx";
import "./dashboard.css";

type SandboxInfo = {
  id: string;
  image: string | { uri: string };
  metadata?: Record<string, string>;
  status: {
    state: string;
    reason?: string;
    message?: string;
  };
  createdAt: string;
  expiresAt: string | null;
};

type ListResponse = {
  items: SandboxInfo[];
  pagination?: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

type DialogMode = "create" | "command" | "renew" | "delete" | "endpoint" | "files" | "metrics" | null;

const stateFilters = ["All", "Running", "Paused", "Creating", "Error", "Deleted"];

export function Dashboard() {
  const [sandboxes, setSandboxes] = useState<SandboxInfo[]>([]);
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [activeSandbox, setActiveSandbox] = useState<SandboxInfo | null>(null);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const loadSandboxes = useCallback(async () => {
    setError("");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (stateFilter !== "All") params.set("state", stateFilter);

    try {
      const response = await fetch(`/api/sandboxes?${params.toString()}`);
      const data = await readJson<ListResponse>(response);
      setSandboxes(data.items);
      setTotalItems(data.pagination?.totalItems ?? data.items.length);
    } catch (err) {
      setError(errorMessage(err));
    }
  }, [page, pageSize, stateFilter]);

  useEffect(() => {
    void loadSandboxes();
  }, [loadSandboxes]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const visibleSandboxes = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return sandboxes;

    return sandboxes.filter((sandbox) => {
      const name = getSandboxName(sandbox).toLowerCase();
      return name.includes(needle) || sandbox.id.toLowerCase().includes(needle) || imageName(sandbox).toLowerCase().includes(needle);
    });
  }, [query, sandboxes]);

  const stats = useMemo(() => {
    const running = sandboxes.filter((sandbox) => sandbox.status.state === "Running").length;
    const paused = sandboxes.filter((sandbox) => sandbox.status.state === "Paused").length;
    const expiring = sandboxes.filter((sandbox) => {
      if (!sandbox.expiresAt || sandbox.status.state !== "Running") return false;
      const diff = new Date(sandbox.expiresAt).getTime() - Date.now();
      return diff > 0 && diff < 24 * 60 * 60 * 1000;
    }).length;

    return { total: totalItems || sandboxes.length, running, paused, expiring };
  }, [sandboxes, totalItems]);

  function openDialog(mode: DialogMode, sandbox?: SandboxInfo) {
    setActiveSandbox(sandbox ?? null);
    setDialog(mode);
  }

  async function mutate(action: () => Promise<string>) {
    setError("");
    startTransition(async () => {
      try {
        const message = await action();
        setDialog(null);
        setToast(message);
        await loadSandboxes();
      } catch (err) {
        setError(errorMessage(err));
      }
    });
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <>
      <header className="topnav">
        <div className="container topnav-inner">
          <span className="logo">
            Open<span>Sandbox</span>
          </span>
          <div className="topnav-actions">
            <button className="btn-sm" onClick={() => void loadSandboxes()} disabled={isPending} title="刷新">
              <RefreshCw size={15} />
              刷新
            </button>
            <button className="btn-sm btn-accent" onClick={() => openDialog("create")}>
              <Plus size={15} />
              新建沙箱
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <section className="page-header">
          <h1>沙箱管理</h1>
          <p className="lead">管理 OpenSandbox 实例的生命周期、命令执行、文件、端点、指标和网络策略。</p>
        </section>

        {error ? <div className="alert">{error}</div> : null}

        <section className="stats-grid">
          <StatCard label="沙箱总数" value={stats.total} accent="accent" />
          <StatCard label="运行中" value={stats.running} sub="当前 Running 实例" accent="green" />
          <StatCard label="即将过期" value={stats.expiring} sub="24 小时内到期" accent="yellow" />
          <StatCard label="已暂停" value={stats.paused} sub="Paused 状态" accent="red" />
        </section>

        <section className="toolbar">
          <label className="search-field">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索沙箱名称、ID 或镜像" />
          </label>
          <div className="filter-group">
            {stateFilters.map((filter) => (
              <button
                key={filter}
                className={clsx("filter-btn", stateFilter === filter && "active")}
                onClick={() => {
                  setStateFilter(filter);
                  setPage(1);
                }}
              >
                {filterLabel(filter)}
              </button>
            ))}
          </div>
        </section>

        <section className="table-wrap">
          <table className="sandbox-table">
            <thead>
              <tr>
                <th>沙箱</th>
                <th>状态</th>
                <th>镜像</th>
                <th>创建时间</th>
                <th>到期时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {visibleSandboxes.map((sandbox) => (
                <tr key={sandbox.id}>
                  <td>
                    <div className="sandbox-name">{getSandboxName(sandbox)}</div>
                    <div className="sandbox-id">{sandbox.id}</div>
                  </td>
                  <td>
                    <span className={clsx("status", statusClass(sandbox.status.state))}>{stateLabel(sandbox.status.state)}</span>
                  </td>
                  <td className="time-cell">{imageName(sandbox)}</td>
                  <td className="time-cell">{formatDate(sandbox.createdAt)}</td>
                  <td className="time-cell">{sandbox.expiresAt ? formatDate(sandbox.expiresAt) : "手动清理"}</td>
                  <td>
                    <div className="actions-cell">
                      <IconAction title="续期" onClick={() => openDialog("renew", sandbox)} icon={<RotateCw size={14} />} />
                      <IconAction title="命令" onClick={() => openDialog("command", sandbox)} icon={<Terminal size={14} />} />
                      <IconAction title="文件" onClick={() => openDialog("files", sandbox)} icon={<FileSearch size={14} />} />
                      <IconAction title="端点" onClick={() => openDialog("endpoint", sandbox)} icon={<Activity size={14} />} />
                      <IconAction title="指标" onClick={() => openDialog("metrics", sandbox)} icon={<Gauge size={14} />} />
                      {sandbox.status.state === "Paused" ? (
                        <IconAction title="恢复" onClick={() => void mutate(() => postAction(`/api/sandboxes/${sandbox.id}/resume`, "已恢复"))} icon={<Play size={14} />} />
                      ) : (
                        <IconAction title="暂停" onClick={() => void mutate(() => postAction(`/api/sandboxes/${sandbox.id}/pause`, "已暂停"))} icon={<Pause size={14} />} />
                      )}
                      <IconAction danger title="删除" onClick={() => openDialog("delete", sandbox)} icon={<Trash2 size={14} />} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {visibleSandboxes.length === 0 ? <div className="empty-state">没有匹配的沙箱实例</div> : null}

          <div className="pagination">
            <span className="pagination-info">
              第 {page} / {totalPages} 页，共 {totalItems} 条
              <select
                className="per-page-select"
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {[5, 10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </span>
            <div className="pagination-controls">
              <button className="page-btn" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                上一页
              </button>
              <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>
                下一页
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="pagefoot">
        <div className="container row-between">
          <span className="mono">OpenSandbox v0.1.0</span>
          <span>Next.js 管理后台</span>
        </div>
      </footer>

      {dialog === "create" ? <CreateDialog onClose={() => setDialog(null)} onSubmit={mutate} pending={isPending} /> : null}
      {dialog === "command" && activeSandbox ? <CommandDialog sandbox={activeSandbox} onClose={() => setDialog(null)} /> : null}
      {dialog === "renew" && activeSandbox ? <RenewDialog sandbox={activeSandbox} onClose={() => setDialog(null)} onSubmit={mutate} pending={isPending} /> : null}
      {dialog === "delete" && activeSandbox ? <DeleteDialog sandbox={activeSandbox} onClose={() => setDialog(null)} onSubmit={mutate} pending={isPending} /> : null}
      {dialog === "endpoint" && activeSandbox ? <EndpointDialog sandbox={activeSandbox} onClose={() => setDialog(null)} /> : null}
      {dialog === "files" && activeSandbox ? <FilesDialog sandbox={activeSandbox} onClose={() => setDialog(null)} /> : null}
      {dialog === "metrics" && activeSandbox ? <MetricsDialog sandbox={activeSandbox} onClose={() => setDialog(null)} /> : null}

      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent: string }) {
  return (
    <div className={clsx("stat-card", `${accent}-border`)}>
      <div className="stat-label">{label}</div>
      <div className="stat-value mono">{value}</div>
      {sub ? <div className="stat-sub">{sub}</div> : null}
    </div>
  );
}

function IconAction({ title, icon, onClick, danger }: { title: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button className={clsx("act-btn", danger && "act-danger")} onClick={onClick} title={title} aria-label={title}>
      {icon}
    </button>
  );
}

function CreateDialog({ onClose, onSubmit, pending }: { onClose: () => void; onSubmit: (action: () => Promise<string>) => Promise<void>; pending: boolean }) {
  const [image, setImage] = useState("alpine:3.20");
  const [name, setName] = useState("dashboard-sandbox");
  const [timeoutSeconds, setTimeoutSeconds] = useState(600);

  return (
    <Modal title="新建沙箱" subtitle="创建一个 OpenSandbox 实例" onClose={onClose}>
      <Field label="镜像">
        <input value={image} onChange={(event) => setImage(event.target.value)} />
      </Field>
      <Field label="名称">
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </Field>
      <Field label="TTL 秒数">
        <input type="number" min={60} value={timeoutSeconds} onChange={(event) => setTimeoutSeconds(Number(event.target.value))} />
      </Field>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>取消</button>
        <button
          className="btn-confirm"
          disabled={pending}
          onClick={() =>
            void onSubmit(async () => {
              const response = await fetch("/api/sandboxes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image,
                  timeoutSeconds,
                  metadata: { "app.opensandbox-dashboard/name": name },
                  readyTimeoutSeconds: 60,
                }),
              });
              await readJson(response);
              return "沙箱已创建";
            })
          }
        >
          创建
        </button>
      </div>
    </Modal>
  );
}

function CommandDialog({ sandbox, onClose }: { sandbox: SandboxInfo; onClose: () => void }) {
  const [command, setCommand] = useState("echo hello from opensandbox");
  const [output, setOutput] = useState("");
  const [pending, setPending] = useState(false);

  async function runCommand() {
    setPending(true);
    setOutput("");
    try {
      const response = await fetch(`/api/sandboxes/${sandbox.id}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, timeoutSeconds: 30 }),
      });
      const data = await readJson<{ logs?: { stdout?: { text: string }[]; stderr?: { text: string }[] } }>(response);
      setOutput([...(data.logs?.stdout ?? []), ...(data.logs?.stderr ?? [])].map((line) => line.text).join(""));
    } catch (err) {
      setOutput(errorMessage(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Modal title="执行命令" subtitle={getSandboxName(sandbox)} onClose={onClose}>
      <Field label="命令">
        <textarea value={command} onChange={(event) => setCommand(event.target.value)} />
      </Field>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>关闭</button>
        <button className="btn-confirm" onClick={() => void runCommand()} disabled={pending}>执行</button>
      </div>
      {output ? <pre className="result-box">{output}</pre> : null}
    </Modal>
  );
}

function RenewDialog({ sandbox, onClose, onSubmit, pending }: { sandbox: SandboxInfo; onClose: () => void; onSubmit: (action: () => Promise<string>) => Promise<void>; pending: boolean }) {
  const [hours, setHours] = useState(6);

  return (
    <Modal title="续期沙箱" subtitle={getSandboxName(sandbox)} onClose={onClose}>
      <div className="duration-options">
        {[1, 6, 24, 72, 168].map((item) => (
          <button key={item} className={clsx("duration-opt", hours === item && "selected")} onClick={() => setHours(item)}>
            {item >= 24 ? `${item / 24} 天` : `${item} 小时`}
          </button>
        ))}
      </div>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>取消</button>
        <button className="btn-confirm" disabled={pending} onClick={() => void onSubmit(() => postAction(`/api/sandboxes/${sandbox.id}/renew`, `已续期 ${hours} 小时`, { timeoutSeconds: hours * 3600 }))}>
          确认续期
        </button>
      </div>
    </Modal>
  );
}

function DeleteDialog({ sandbox, onClose, onSubmit, pending }: { sandbox: SandboxInfo; onClose: () => void; onSubmit: (action: () => Promise<string>) => Promise<void>; pending: boolean }) {
  const [confirm, setConfirm] = useState("");
  const name = getSandboxName(sandbox);

  return (
    <Modal title="删除沙箱" subtitle={name} onClose={onClose}>
      <Field label="确认名称">
        <input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder={name} />
      </Field>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>取消</button>
        <button className="btn-danger-solid" disabled={pending || confirm !== name} onClick={() => void onSubmit(() => deleteAction(`/api/sandboxes/${sandbox.id}`, "沙箱已删除"))}>
          删除
        </button>
      </div>
    </Modal>
  );
}

function EndpointDialog({ sandbox, onClose }: { sandbox: SandboxInfo; onClose: () => void }) {
  const [port, setPort] = useState(44772);
  const [result, setResult] = useState("");

  async function loadEndpoint() {
    try {
      const response = await fetch(`/api/sandboxes/${sandbox.id}/endpoint?port=${port}`);
      const data = await readJson<{ endpoint: { endpoint: string }; url: string }>(response);
      setResult(`${data.endpoint.endpoint}\n${data.url}`);
    } catch (err) {
      setResult(errorMessage(err));
    }
  }

  return (
    <Modal title="端点解析" subtitle={getSandboxName(sandbox)} onClose={onClose}>
      <Field label="端口">
        <input type="number" value={port} onChange={(event) => setPort(Number(event.target.value))} />
      </Field>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>关闭</button>
        <button className="btn-confirm" onClick={() => void loadEndpoint()}>解析</button>
      </div>
      {result ? <pre className="result-box">{result}</pre> : null}
    </Modal>
  );
}

function FilesDialog({ sandbox, onClose }: { sandbox: SandboxInfo; onClose: () => void }) {
  const [path, setPath] = useState("/tmp/opensandbox-dashboard.txt");
  const [content, setContent] = useState("hello\n");
  const [result, setResult] = useState("");

  async function readFile() {
    try {
      const response = await fetch(`/api/sandboxes/${sandbox.id}/files?path=${encodeURIComponent(path)}`);
      const data = await readJson<{ content: string }>(response);
      setResult(data.content);
    } catch (err) {
      setResult(errorMessage(err));
    }
  }

  async function writeFile() {
    try {
      const response = await fetch(`/api/sandboxes/${sandbox.id}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, data: content }),
      });
      await readJson(response);
      setResult("写入成功");
    } catch (err) {
      setResult(errorMessage(err));
    }
  }

  return (
    <Modal title="文件操作" subtitle={getSandboxName(sandbox)} onClose={onClose}>
      <Field label="路径">
        <input value={path} onChange={(event) => setPath(event.target.value)} />
      </Field>
      <Field label="内容">
        <textarea value={content} onChange={(event) => setContent(event.target.value)} />
      </Field>
      <div className="modal-actions">
        <button className="btn-cancel" onClick={onClose}>关闭</button>
        <button className="btn-cancel" onClick={() => void readFile()}>读取</button>
        <button className="btn-confirm" onClick={() => void writeFile()}>写入</button>
      </div>
      {result ? <pre className="result-box">{result}</pre> : null}
    </Modal>
  );
}

function MetricsDialog({ sandbox, onClose }: { sandbox: SandboxInfo; onClose: () => void }) {
  const [result, setResult] = useState("");

  useEffect(() => {
    async function loadMetrics() {
      try {
        const response = await fetch(`/api/sandboxes/${sandbox.id}/metrics`);
        const data = await readJson(response);
        setResult(JSON.stringify(data, null, 2));
      } catch (err) {
        setResult(errorMessage(err));
      }
    }

    void loadMetrics();
  }, [sandbox.id]);

  return (
    <Modal title="资源指标" subtitle={getSandboxName(sandbox)} onClose={onClose}>
      <pre className="result-box">{result || "加载中..."}</pre>
      <div className="modal-actions">
        <button className="btn-confirm" onClick={onClose}>关闭</button>
      </div>
    </Modal>
  );
}

function Modal({ title, subtitle, children, onClose }: { title: string; subtitle: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <h2>{title}</h2>
        <p className="modal-sub">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

async function postAction(url: string, message: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  await readJson(response);
  return message;
}

async function deleteAction(url: string, message: string) {
  const response = await fetch(url, { method: "DELETE" });
  await readJson(response);
  return message;
}

async function readJson<T = unknown>(response: Response): Promise<T> {
  const data = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) throw new Error(data.error?.message ?? `HTTP ${response.status}`);
  return data;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "请求失败";
}

function getSandboxName(sandbox: SandboxInfo) {
  return sandbox.metadata?.["app.opensandbox-dashboard/name"] ?? sandbox.metadata?.name ?? sandbox.id;
}

function imageName(sandbox: SandboxInfo) {
  return typeof sandbox.image === "string" ? sandbox.image : sandbox.image.uri;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function filterLabel(value: string) {
  const labels: Record<string, string> = {
    All: "全部",
    Running: "运行中",
    Paused: "已暂停",
    Creating: "创建中",
    Error: "异常",
    Deleted: "已删除",
  };
  return labels[value] ?? value;
}

function stateLabel(value: string) {
  const labels: Record<string, string> = {
    Running: "运行中",
    Paused: "已暂停",
    Creating: "创建中",
    Error: "异常",
    Deleted: "已删除",
    Deleting: "删除中",
  };
  return labels[value] ?? value;
}

function statusClass(value: string) {
  const map: Record<string, string> = {
    Running: "status-running",
    Paused: "status-stopped",
    Creating: "status-creating",
    Error: "status-error",
    Deleted: "status-expired",
    Deleting: "status-expired",
  };
  return map[value] ?? "status-stopped";
}
