"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/constants";
import { buildCustomerProfileView } from "@/lib/customer-profile";
import { formatDate } from "@/lib/format";
import { formatGBP } from "@/lib/money";
import { ApiError, api } from "@/lib/client";
import { Button, Dialog, ErrorState, SelectField, StatusBadge, TextField } from "./ui";
import { useToast } from "./providers";

type Account = {
  id: string;
  name: string;
  currentBalance: string;
  status: string;
  accountNumber: string;
  dailyLimit: string;
  cardLast4: string | null;
};

type CustomerNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
};

type Txn = {
  id: string;
  accountId: string;
  description: string;
  amount: string;
  type: "CREDIT" | "DEBIT";
  status: string;
  reference: string;
  category: string;
  merchant: string | null;
  transactionDate: string;
};

export function AdminCustomer({
  user,
  accounts,
  transactions,
  notifications,
}: {
  user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    status: string;
    balance?: string;
    dateOfBirth?: string;
    addressLine?: string | null;
    city?: string | null;
    postcode?: string | null;
    occupation?: string | null;
    nationality?: string | null;
    maritalStatus?: string | null;
    employerName?: string | null;
    jobTitle?: string | null;
    workEmail?: string | null;
    workPhone?: string | null;
    workAddressLine?: string | null;
    workCity?: string | null;
    workPostcode?: string | null;
    employmentStatus?: string | null;
    onlinePaymentLimit?: string;
    hasLoginPin?: boolean;
  };
  accounts: Account[];
  transactions: Txn[];
  notifications: CustomerNotification[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<
    "funds" | "edit" | "txn" | "status" | "reverse" | "delete" | "setBalance" | "editAccount" | "editTxn" | "deleteTxn" | "loginPin" | null
  >(null);
  const [clearLoginPin, setClearLoginPin] = useState(false);
  const [fundType, setFundType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [statusAction, setStatusAction] = useState("SUSPEND");
  const [reverseId, setReverseId] = useState("");
  const [activeTxn, setActiveTxn] = useState<Txn | null>(null);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);

  async function run(url: string, body: unknown, message: string, method = "POST") {
    setError("");
    try {
      await api(url, { method, body: JSON.stringify(body) });
      toast(message);
      setDialog(null);
      setActiveTxn(null);
      setActiveAccount(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Request failed");
    }
  }

  function openEditTxn(txn: Txn) {
    setActiveTxn(txn);
    setDialog("editTxn");
  }

  function openDeleteTxn(txn: Txn) {
    setActiveTxn(txn);
    setDialog("deleteTxn");
  }

  const profileView = buildCustomerProfileView(
    {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth ? new Date(`${user.dateOfBirth}T00:00:00.000Z`) : null,
      addressLine: user.addressLine ?? null,
      city: user.city ?? null,
      postcode: user.postcode ?? null,
      occupation: user.occupation ?? null,
      nationality: user.nationality ?? null,
      maritalStatus: user.maritalStatus ?? null,
      employerName: user.employerName ?? null,
      jobTitle: user.jobTitle ?? null,
      workEmail: user.workEmail ?? null,
      workPhone: user.workPhone ?? null,
      workAddressLine: user.workAddressLine ?? null,
      workCity: user.workCity ?? null,
      workPostcode: user.workPostcode ?? null,
      employmentStatus: user.employmentStatus ?? null,
    },
    { useSampleDefaults: false },
  );

  return (
    <div className="space-y-4">
      {error ? <ErrorState message={error} /> : null}
      <section className="rounded-2xl bg-white p-5 ring-1 ring-line">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{user.fullName}</h1>
            <p className="text-sm text-neutral-500">{user.email}</p>
            <p className="text-sm text-neutral-500">{user.phone || "No phone"}</p>
            {user.addressLine ? <p className="mt-1 text-sm text-neutral-500">{user.addressLine}</p> : null}
            {user.city || user.postcode ? (
              <p className="text-sm text-neutral-500">
                {[user.city, user.postcode].filter(Boolean).join(" · ")}
              </p>
            ) : null}
            {user.occupation ? <p className="text-sm text-neutral-500">{user.occupation}</p> : null}
          </div>
          <StatusBadge status={user.status} />
        </div>
        <p className="mt-4 text-3xl font-semibold tracking-tight">{formatGBP(user.balance ?? "0.00")}</p>
        <p className="text-sm text-neutral-500">Total balance across accounts</p>
        {user.onlinePaymentLimit ? (
          <p className="mt-1 text-sm text-neutral-500">Online payment limit {formatGBP(user.onlinePaymentLimit)}</p>
        ) : null}
        <p className="mt-1 text-sm text-neutral-500">
          Log on PIN: {user.hasLoginPin ? "Set (6 digits)" : "Not set — customer cannot log on"}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" onClick={() => { setFundType("CREDIT"); setDialog("funds"); }}>Add funds</Button>
          <Button type="button" variant="secondary" onClick={() => { setFundType("DEBIT"); setDialog("funds"); }}>Deduct funds</Button>
          <Button type="button" variant="secondary" onClick={() => setDialog("txn")}>Create transaction</Button>
          <Button type="button" variant="secondary" onClick={() => { setClearLoginPin(false); setDialog("loginPin"); }}>
            Log on PIN
          </Button>
          <Button type="button" variant="secondary" onClick={() => setDialog("edit")}>Edit profile</Button>
          <Button type="button" variant="secondary" onClick={() => setDialog("status")}>Account status</Button>
          <Button type="button" variant="danger" onClick={() => setDialog("delete")}>Delete customer</Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="text-sm font-semibold">Personal details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <AdminProfileRow label="Date of birth" value={profileView.personal.dateOfBirth ? formatDate(profileView.personal.dateOfBirth) : ""} />
            <AdminProfileRow label="Nationality" value={profileView.personal.nationality} />
            <AdminProfileRow label="Marital status" value={profileView.personal.maritalStatus} />
            <AdminProfileRow
              label="Home address"
              value={[profileView.personal.addressLine, profileView.personal.city, profileView.personal.postcode].filter(Boolean).join(", ")}
            />
            <AdminProfileRow label="Occupation" value={profileView.personal.occupation} />
          </dl>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="text-sm font-semibold">Professional details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <AdminProfileRow label="Employment" value={profileView.professional.employmentStatus} />
            <AdminProfileRow label="Employer" value={profileView.professional.employerName} />
            <AdminProfileRow label="Job title" value={profileView.professional.jobTitle} />
            <AdminProfileRow label="Work email" value={profileView.professional.workEmail} />
            <AdminProfileRow label="Work phone" value={profileView.professional.workPhone} />
            <AdminProfileRow
              label="Work address"
              value={[profileView.professional.workAddressLine, profileView.professional.workCity, profileView.professional.workPostcode].filter(Boolean).join(", ")}
            />
          </dl>
        </div>
      </section>

      {accounts.map((account) => (
        <section key={account.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{account.name}</p>
              <p className="font-mono text-sm text-neutral-500">{account.accountNumber}</p>
              <p className="text-xs text-neutral-500">
                Daily limit {formatGBP(account.dailyLimit)}
                {account.cardLast4 ? ` · Card •••• ${account.cardLast4}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold">{formatGBP(account.currentBalance)}</p>
              <StatusBadge status={account.status} />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setActiveAccount(account);
                setDialog("setBalance");
              }}
            >
              Set balance
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setActiveAccount(account);
                setDialog("editAccount");
              }}
            >
              Edit account
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                const suspending = account.status === "ACTIVE";
                if (!window.confirm(suspending ? "Suspend this account?" : "Activate this account?")) return;
                void run(`/api/admin/accounts/${account.id}/status`, {
                  status: suspending ? "SUSPENDED" : "ACTIVE",
                  reason: suspending ? "Account suspended by staff" : "Account activated by staff",
                }, "Account updated");
              }}
            >
              {account.status === "ACTIVE" ? "Suspend account" : "Activate account"}
            </Button>
          </div>
        </section>
      ))}

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Customer notifications</h2>
        {notifications.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">No notifications for this customer.</p>
        ) : null}
        {notifications.map((item) => (
          <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">{item.body}</p>
              <p className="mt-1 text-xs text-neutral-400">
                {item.type.toLowerCase()} · {item.read ? "Read" : "Unread"} · {new Date(item.createdAt).toLocaleString("en-GB")}
              </p>
            </div>
            <Button
              type="button"
              variant="danger"
              className="shrink-0"
              onClick={() => {
                if (!window.confirm(`Delete notification “${item.title}”?`)) return;
                void run(`/api/admin/notifications/${item.id}`, { reason: "Removed by staff" }, "Notification deleted", "DELETE");
              }}
            >
              Delete
            </Button>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-line">
        <h2 className="border-b border-line px-4 py-3 text-sm font-semibold">Transaction history</h2>
        {transactions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">No transactions yet.</p>
        ) : null}
        {transactions.map((txn) => (
          <div key={txn.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{txn.description}</p>
              <p className="text-xs text-neutral-500">
                {txn.reference} · {txn.category} · {txn.status.toLowerCase()}
              </p>
              <p className="text-xs text-neutral-400">{new Date(txn.transactionDate).toLocaleString("en-GB")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{txn.type === "DEBIT" ? "-" : "+"}{formatGBP(txn.amount)}</p>
              <div className="mt-1 flex flex-wrap justify-end gap-2">
                <button type="button" className="text-xs font-semibold text-brand" onClick={() => openEditTxn(txn)}>
                  Edit
                </button>
                {txn.status !== "REVERSED" ? (
                  <button type="button" className="text-xs font-semibold text-red-700" onClick={() => openDeleteTxn(txn)}>
                    Delete
                  </button>
                ) : null}
                {txn.status === "COMPLETED" ? (
                  <button
                    type="button"
                    className="text-xs font-semibold text-neutral-600"
                    onClick={() => {
                      setReverseId(txn.id);
                      setDialog("reverse");
                    }}
                  >
                    Reverse
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </section>

      <Dialog open={dialog === "funds"} title={fundType === "CREDIT" ? "Add funds" : "Deduct funds"} onClose={() => setDialog(null)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(`/api/admin/accounts/${data.get("accountId")}/adjust`, {
              type: fundType,
              amount: data.get("amount"),
            }, fundType === "CREDIT" ? "Funds added" : "Funds deducted");
          }}
        >
          <SelectField label="Account" name="accountId" value={accountId} onChange={(event) => setAccountId(event.target.value)}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </SelectField>
          <TextField label="Amount" name="amount" inputMode="decimal" required />
          <Button type="submit" className="w-full">Confirm</Button>
        </form>
      </Dialog>

      <Dialog open={dialog === "setBalance" && Boolean(activeAccount)} title="Set account balance" onClose={() => setDialog(null)}>
        {activeAccount ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(`/api/admin/accounts/${activeAccount.id}/balance`, {
                balance: data.get("balance"),
                reason: data.get("reason"),
              }, "Balance updated");
            }}
          >
            <p className="text-sm text-neutral-600">Current balance: {formatGBP(activeAccount.currentBalance)}</p>
            <TextField label="New balance" name="balance" inputMode="decimal" defaultValue={activeAccount.currentBalance} required />
            <TextField label="Reason" name="reason" required />
            <Button type="submit" className="w-full">Update balance</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={dialog === "editAccount" && Boolean(activeAccount)} title="Edit account" onClose={() => setDialog(null)}>
        {activeAccount ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(`/api/admin/accounts/${activeAccount.id}`, {
                name: data.get("name"),
                dailyLimit: data.get("dailyLimit"),
                cardLast4: data.get("cardLast4") || undefined,
                reason: data.get("reason"),
              }, "Account updated", "PATCH");
            }}
          >
            <TextField label="Account name" name="name" defaultValue={activeAccount.name} required />
            <TextField label="Daily limit" name="dailyLimit" inputMode="decimal" defaultValue={activeAccount.dailyLimit} required />
            <TextField
              label="Debit card last 4 digits"
              name="cardLast4"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              defaultValue={activeAccount.cardLast4 ?? ""}
              placeholder="e.g. 4100"
            />
            <TextField label="Reason" name="reason" required />
            <Button type="submit" className="w-full">Save</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={dialog === "loginPin"} title="Log on PIN" onClose={() => setDialog(null)}>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(
              `/api/admin/users/${user.id}/login-pin`,
              {
                pin: clearLoginPin ? "" : data.get("loginPin") || undefined,
                reason: data.get("reason"),
              },
              clearLoginPin ? "Log on PIN removed" : "Log on PIN saved",
              "PUT",
            );
          }}
        >
          <p className="text-sm text-neutral-600">
            Customers enter this 6-digit PIN after email and password. PINs are stored securely and cannot be viewed once saved.
          </p>
          {!clearLoginPin ? (
            <TextField
              label="6-digit log on PIN"
              name="loginPin"
              inputMode="numeric"
              maxLength={6}
              pattern="\d{6}"
              placeholder={user.hasLoginPin ? "Enter new PIN to replace" : "Create PIN"}
              required={!user.hasLoginPin}
            />
          ) : (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">The log on PIN will be removed. The customer will not be able to log on until a new PIN is set.</p>
          )}
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={clearLoginPin} onChange={(event) => setClearLoginPin(event.target.checked)} />
            Remove log on PIN
          </label>
          <TextField label="Reason" name="reason" required />
          <Button type="submit" className="w-full">{clearLoginPin ? "Remove PIN" : "Save PIN"}</Button>
        </form>
      </Dialog>

      <Dialog open={dialog === "edit"} title="Edit customer profile" onClose={() => setDialog(null)}>
        <form
          className="max-h-[70vh] space-y-4 overflow-y-auto pr-1"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(`/api/admin/users/${user.id}`, {
              fullName: data.get("fullName"),
              email: data.get("email"),
              phone: data.get("phone"),
              dateOfBirth: data.get("dateOfBirth") || undefined,
              addressLine: data.get("addressLine") || undefined,
              city: data.get("city") || undefined,
              postcode: data.get("postcode") || undefined,
              occupation: data.get("occupation") || undefined,
              nationality: data.get("nationality") || undefined,
              maritalStatus: data.get("maritalStatus") || undefined,
              employerName: data.get("employerName") || undefined,
              jobTitle: data.get("jobTitle") || undefined,
              workEmail: data.get("workEmail") || undefined,
              workPhone: data.get("workPhone") || undefined,
              workAddressLine: data.get("workAddressLine") || undefined,
              workCity: data.get("workCity") || undefined,
              workPostcode: data.get("workPostcode") || undefined,
              employmentStatus: data.get("employmentStatus") || undefined,
              onlinePaymentLimit: data.get("onlinePaymentLimit") || undefined,
              balancePin: data.get("balancePin") || undefined,
              reason: data.get("reason"),
            }, "Customer updated", "PATCH");
          }}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Personal</p>
            <TextField label="Full name" name="fullName" defaultValue={user.fullName} required />
            <TextField label="Email" name="email" type="email" defaultValue={user.email} required />
            <TextField label="Phone" name="phone" defaultValue={user.phone ?? ""} />
            <TextField label="Date of birth" name="dateOfBirth" type="date" defaultValue={user.dateOfBirth ?? ""} />
            <TextField label="Address" name="addressLine" defaultValue={user.addressLine ?? ""} />
            <TextField label="City" name="city" defaultValue={user.city ?? ""} />
            <TextField label="Postcode" name="postcode" defaultValue={user.postcode ?? ""} />
            <TextField label="Occupation" name="occupation" defaultValue={user.occupation ?? ""} />
            <TextField label="Nationality" name="nationality" defaultValue={user.nationality ?? ""} />
            <TextField label="Marital status" name="maritalStatus" defaultValue={user.maritalStatus ?? ""} />
          </div>
          <div className="space-y-3 border-t border-line pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Professional</p>
            <TextField label="Employment status" name="employmentStatus" defaultValue={user.employmentStatus ?? ""} />
            <TextField label="Employer" name="employerName" defaultValue={user.employerName ?? ""} />
            <TextField label="Job title" name="jobTitle" defaultValue={user.jobTitle ?? ""} />
            <TextField label="Work email" name="workEmail" type="email" defaultValue={user.workEmail ?? ""} />
            <TextField label="Work phone" name="workPhone" defaultValue={user.workPhone ?? ""} />
            <TextField label="Work address" name="workAddressLine" defaultValue={user.workAddressLine ?? ""} />
            <TextField label="Work city" name="workCity" defaultValue={user.workCity ?? ""} />
            <TextField label="Work postcode" name="workPostcode" defaultValue={user.workPostcode ?? ""} />
          </div>
          <div className="space-y-3 border-t border-line pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment limits</p>
            <TextField
              label="Online payment limit (£)"
              name="onlinePaymentLimit"
              inputMode="decimal"
              defaultValue={user.onlinePaymentLimit ?? "25000.00"}
              required
            />
          </div>
          <TextField label="4-digit password" name="balancePin" inputMode="numeric" maxLength={4} pattern="\d{4}" placeholder="Leave blank to keep the current one" />
          <TextField label="Reason" name="reason" required />
          <Button type="submit" className="w-full">Save profile</Button>
        </form>
      </Dialog>

      <Dialog open={dialog === "status"} title="Change customer status" onClose={() => setDialog(null)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(`/api/admin/users/${user.id}/status`, { action: statusAction, reason: data.get("reason") }, "Status updated");
          }}
        >
          <SelectField label="Action" value={statusAction} onChange={(event) => setStatusAction(event.target.value)}>
            <option value="SUSPEND">Suspend</option>
            <option value="ACTIVATE">Activate</option>
            <option value="LOCK">Lock</option>
            <option value="UNLOCK">Unlock</option>
          </SelectField>
          <TextField label="Reason" name="reason" required />
          <Button type="submit" className="w-full">Confirm</Button>
        </form>
      </Dialog>

      <Dialog open={dialog === "txn"} title="Create transaction" onClose={() => setDialog(null)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run("/api/admin/transactions", {
              accountId: data.get("accountId"),
              type: data.get("type"),
              amount: data.get("amount"),
              description: data.get("description"),
              merchant: data.get("merchant") || undefined,
              category: data.get("category"),
              transactionDate: data.get("transactionDate") || new Date().toISOString(),
              status: data.get("status"),
              reason: data.get("reason"),
            }, "Transaction created");
          }}
        >
          <SelectField label="Account" name="accountId" defaultValue={accounts[0]?.id}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </SelectField>
          <SelectField label="Type" name="type" defaultValue="CREDIT">
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </SelectField>
          <TextField label="Amount" name="amount" inputMode="decimal" required />
          <TextField label="Description" name="description" required />
          <TextField label="Merchant" name="merchant" />
          <SelectField label="Category" name="category" defaultValue="Adjustment">
            {CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </SelectField>
          <TextField label="Date" name="transactionDate" type="datetime-local" />
          <SelectField label="Status" name="status" defaultValue="COMPLETED">
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
          </SelectField>
          <TextField label="Reason" name="reason" required />
          <Button type="submit" className="w-full">Confirm</Button>
        </form>
      </Dialog>

      <Dialog open={dialog === "editTxn" && Boolean(activeTxn)} title="Edit transaction" onClose={() => setDialog(null)}>
        {activeTxn ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(`/api/admin/transactions/${activeTxn.id}`, {
                description: data.get("description"),
                merchant: data.get("merchant") || undefined,
                category: data.get("category"),
                amount: data.get("amount") || undefined,
                type: data.get("type") || undefined,
                transactionDate: data.get("transactionDate") ? new Date(String(data.get("transactionDate"))).toISOString() : undefined,
                status: data.get("status") || undefined,
                reason: data.get("reason"),
              }, "Transaction updated", "PATCH");
            }}
          >
            <TextField label="Description" name="description" defaultValue={activeTxn.description} required />
            <TextField label="Merchant" name="merchant" defaultValue={activeTxn.merchant ?? ""} />
            <SelectField label="Category" name="category" defaultValue={activeTxn.category}>
              {CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </SelectField>
            <SelectField label="Type" name="type" defaultValue={activeTxn.type}>
              <option value="CREDIT">Credit</option>
              <option value="DEBIT">Debit</option>
            </SelectField>
            <TextField label="Amount" name="amount" inputMode="decimal" defaultValue={activeTxn.amount} required />
            <TextField
              label="Date"
              name="transactionDate"
              type="datetime-local"
              defaultValue={activeTxn.transactionDate.slice(0, 16)}
            />
            <SelectField label="Status" name="status" defaultValue={activeTxn.status}>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </SelectField>
            <TextField label="Reason" name="reason" required />
            <Button type="submit" className="w-full">Save changes</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={dialog === "deleteTxn" && Boolean(activeTxn)} title="Delete transaction" onClose={() => setDialog(null)}>
        {activeTxn ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              void run(`/api/admin/transactions/${activeTxn.id}`, { reason: data.get("reason") }, "Transaction deleted", "DELETE");
            }}
          >
            <p className="text-sm text-neutral-600">
              This removes the entry from history. Completed transactions adjust the account balance automatically.
            </p>
            <p className="text-sm font-medium">{activeTxn.description} · {formatGBP(activeTxn.amount)}</p>
            <TextField label="Reason" name="reason" required />
            <Button type="submit" variant="danger" className="w-full">Delete transaction</Button>
          </form>
        ) : null}
      </Dialog>

      <Dialog open={dialog === "reverse"} title="Reverse transaction" onClose={() => setDialog(null)}>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            void run(`/api/admin/transactions/${reverseId}/reverse`, { reason: data.get("reason") }, "Transaction reversed");
          }}
        >
          <p className="text-sm text-neutral-600">A new opposite entry is created. The original stays on record as reversed.</p>
          <TextField label="Reason" name="reason" required />
          <Button type="submit" className="w-full">Confirm reversal</Button>
        </form>
      </Dialog>

      <Dialog open={dialog === "delete"} title="Delete customer" onClose={() => setDialog(null)}>
        <p className="text-sm text-neutral-600">This removes the customer, their accounts and their history.</p>
        <Button type="button" variant="danger" className="mt-4 w-full" onClick={() => run(`/api/admin/users/${user.id}`, {}, "Customer deleted", "DELETE")}>
          Delete customer
        </Button>
      </Dialog>
    </div>
  );
}

function AdminProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-right font-medium">{value || "Not set"}</dd>
    </div>
  );
}
