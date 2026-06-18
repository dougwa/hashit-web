import { hashit } from "@/lib/hashit";
import type { Drive } from "@/lib/types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DrivesPage() {
  const { data: drives, error } = await hashit.GET("/v1/drives");

  if (error) {
    return (
      <div className="border border-red-900 rounded p-4 text-red-400 text-sm">
        Could not reach hashit — is it running at{" "}
        <code>{process.env.HASHIT_URL ?? "http://127.0.0.1:8087"}</code>?
      </div>
    );
  }

  const online = drives?.filter((d) => d.online) ?? [];
  const offline = drives?.filter((d) => !d.online) ?? [];

  return (
    <div>
      <h1 className="text-lg font-semibold mb-6">Drives</h1>

      {drives?.length === 0 && (
        <p className="text-slate-400 text-sm">
          No drives indexed yet. Run{" "}
          <code className="text-slate-300">hashit index ~/your/files</code> to get started.
        </p>
      )}

      {online.length > 0 && (
        <Section label="Online">
          {online.map((d) => (
            <DriveCard key={d.drive_id} drive={d} />
          ))}
        </Section>
      )}

      {offline.length > 0 && (
        <Section label="Offline">
          {offline.map((d) => (
            <DriveCard key={d.drive_id} drive={d} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {label}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>
    </section>
  );
}

function DriveCard({ drive }: { drive: Drive }) {
  return (
    <Link
      href={`/browse?drive=${drive.drive_id}`}
      className="block border border-slate-800 rounded-lg p-4 hover:border-slate-600 hover:bg-slate-900/40 transition-colors group"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="font-semibold text-slate-100 group-hover:text-white truncate mr-2">
          {drive.label ?? drive.drive_id}
        </span>
        <span
          className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
            drive.online
              ? "bg-green-900/40 text-green-400"
              : "bg-slate-800 text-slate-500"
          }`}
        >
          {drive.online ? "online" : "offline"}
        </span>
      </div>
      <p className="text-xs text-slate-500 truncate mb-2">{drive.last_root}</p>
      <p className="text-sm text-slate-400">{drive.files?.toLocaleString()} files</p>
    </Link>
  );
}
