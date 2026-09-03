import { Panel, PanelHeading, StatusDot } from "@/components/admin/panel";
import { requireAdmin } from "@/lib/admin/dal";

export const metadata = { title: "Systems Check" };

export const dynamic = "force-dynamic";

type Check = {
  name: string;
  detail: string;
  configured: boolean;
  required: boolean;
};

/**
 * Presence only. This deliberately reports booleans and never the values, so a
 * screenshot of this page cannot leak an API key.
 */
function collectChecks(): Check[] {
  const has = (name: string) => Boolean(process.env[name]?.trim());

  const resendConfigured =
    has("RESEND_API_KEY") &&
    has("CONTACT_TO_EMAIL") &&
    has("CONTACT_FROM_EMAIL");

  return [
    {
      name: "Admin session secret",
      detail: "ADMIN_SESSION_SECRET — signs the admin session cookie.",
      configured: (process.env.ADMIN_SESSION_SECRET?.length ?? 0) >= 32,
      required: true,
    },
    {
      name: "Admin password hash",
      detail: "ADMIN_PASSWORD_HASH — scrypt digest of the operator password.",
      configured: has("ADMIN_PASSWORD_HASH"),
      required: true,
    },
    {
      name: "Contact email delivery",
      detail:
        "RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL — transactional email for new leads.",
      configured: resendConfigured,
      required: false,
    },
    {
      name: "Contact webhook",
      detail: "CONTACT_WEBHOOK_URL — CRM or automation endpoint for new leads.",
      configured: has("CONTACT_WEBHOOK_URL"),
      required: false,
    },
  ];
}

export default async function SystemsCheckPage() {
  await requireAdmin();

  const checks = collectChecks();
  const leadDelivery = checks.filter(
    (check) =>
      check.name === "Contact email delivery" || check.name === "Contact webhook",
  );
  const noLeadDelivery = leadDelivery.every((check) => !check.configured);

  return (
    <div className="flex flex-col gap-8">
      <PanelHeading
        title="Systems Check"
        label="Diagnostics"
        index="01"
        description="What this environment has wired up. Values are never read or displayed, only their presence."
      />

      {noLeadDelivery ? (
        <Panel className="border-cedar-heartwood/45 bg-cedar-heartwood/10">
          <p className="text-[0.9375rem] leading-relaxed text-fresh-cut">
            No lead delivery is configured. Contact submissions are validated and
            logged server-side, but nothing is sent. Set the Resend variables or
            a webhook URL to start delivering.
          </p>
        </Panel>
      ) : null}

      <Panel className="p-0 sm:p-0">
        <ul className="divide-y divide-muted-steel/20">
          {checks.map((check) => (
            <li
              key={check.name}
              className="flex flex-wrap items-start justify-between gap-4 px-6 py-5 sm:px-8"
            >
              <div className="max-w-xl">
                <StatusDot
                  tone={
                    check.configured
                      ? "ok"
                      : check.required
                        ? "warn"
                        : "missing"
                  }
                  label={check.name}
                />
                <p className="mt-2 font-mono text-[0.8125rem] leading-relaxed text-steel-text">
                  {check.detail}
                </p>
              </div>

              <span className="label-technical shrink-0 text-steel-text">
                {check.configured
                  ? "Configured"
                  : check.required
                    ? "Required — missing"
                    : "Not set"}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel>
        <PanelHeading title="Runtime" label="Environment" index="02" />
        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          {[
            { label: "Node", value: process.version },
            { label: "Mode", value: process.env.NODE_ENV ?? "unknown" },
            {
              label: "Deployment",
              value: process.env.VERCEL_ENV ?? "local",
            },
          ].map((item) => (
            <div key={item.label}>
              <dt className="label-technical text-steel-text">{item.label}</dt>
              <dd className="mt-2 font-mono text-[0.9375rem] text-workshop-white">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
