import React, { useState, useMemo } from "react";
import {
  DollarSign,
  Plus,
  Trash2,
  Users,
  CheckCircle2,
  Calculator,
  PieChart,
  Receipt,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

interface ExpenseItem {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  category: "Food" | "Fuel" | "Stay" | "Toll" | "Activity";
  timestamp: string;
}

interface GroupTripLedgerProps {
  members?: string[];
  masterBudget?: number;
}

export const GroupTripLedger: React.FC<GroupTripLedgerProps> = ({
  members = ["Anish Patel", "Rohan Kumar", "Priya Sharma"],
  masterBudget = 18000,
}) => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    {
      id: "exp-1",
      description: "Highway Food Plaza Lunch",
      amount: 1500,
      paidBy: "Anish Patel",
      category: "Food",
      timestamp: "Today, 1:30 PM",
    },
    {
      id: "exp-2",
      description: "Expressway FASTag Toll & Petrol",
      amount: 2400,
      paidBy: "Rohan Kumar",
      category: "Fuel",
      timestamp: "Today, 3:15 PM",
    },
    {
      id: "exp-3",
      description: "Lonavala Hill Resort Deposit",
      amount: 4500,
      paidBy: "Priya Sharma",
      category: "Stay",
      timestamp: "Yesterday, 6:00 PM",
    },
  ]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]);
  const [category, setCategory] = useState<"Food" | "Fuel" | "Stay" | "Toll" | "Activity">("Food");

  const totalSpent = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const equalShare = useMemo(() => {
    return members.length > 0 ? totalSpent / members.length : 0;
  }, [totalSpent, members]);

  // Calculate balances per member (Paid - Share)
  const balances = useMemo(() => {
    const map: Record<string, number> = {};
    members.forEach((m) => (map[m] = 0));

    expenses.forEach((exp) => {
      if (map[exp.paidBy] !== undefined) {
        map[exp.paidBy] += exp.amount;
      }
    });

    const settlement: Record<string, { paid: number; netBalance: number }> = {};
    members.forEach((m) => {
      const paid = map[m] || 0;
      settlement[m] = {
        paid,
        netBalance: paid - equalShare,
      };
    });

    return settlement;
  }, [expenses, members, equalShare]);

  // Calculate 1-click settlement transactions
  const settlements = useMemo(() => {
    const debtors: { name: string; amount: number }[] = [];
    const creditors: { name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([name, data]) => {
      if (data.netBalance < -1) {
        debtors.push({ name, amount: Math.abs(data.netBalance) });
      } else if (data.netBalance > 1) {
        creditors.push({ name, amount: data.netBalance });
      }
    });

    const result: { from: string; to: string; amount: number }[] = [];
    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const transfer = Math.min(debtor.amount, creditor.amount);
      if (transfer > 0) {
        result.push({
          from: debtor.name,
          to: creditor.name,
          amount: Math.round(transfer),
        });
      }

      debtor.amount -= transfer;
      creditor.amount -= transfer;

      if (debtor.amount <= 1) dIdx++;
      if (creditor.amount <= 1) cIdx++;
    }

    return result;
  }, [balances]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid expense description and amount.");
      return;
    }

    const newExp: ExpenseItem = {
      id: `exp-${Date.now()}`,
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      category,
      timestamp: "Just now",
    };

    setExpenses((prev) => [newExp, ...prev]);
    setDescription("");
    setAmount("");
    toast.success(`Logged ₹${parsedAmount} paid by ${paidBy}`);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((item) => item.id !== id));
    toast.info("Expense removed from ledger.");
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/40 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Group Spent</p>
              <h3 className="text-2xl font-black text-white mt-1 text-emerald-400 font-mono">
                ₹{totalSpent.toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Master Target Ceiling: ₹{masterBudget.toLocaleString()}
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/40 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Equal Share Per Person</p>
              <h3 className="text-2xl font-black text-white mt-1 text-[#D4AF37] font-mono">
                ₹{Math.round(equalShare).toLocaleString()}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Split across {members.length} trip members
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-[#0B2B5C]/40 backdrop-blur-xl shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending Settlements</p>
              <h3 className="text-2xl font-black text-white mt-1 text-blue-400 font-mono">
                {settlements.length} transfers
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Calculator className="h-5 w-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Auto-balanced 1-click settlement summary</p>
        </div>
      </div>

      {/* Add Expense Form & Settlement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Log New Expense Form */}
        <div className="lg:col-span-1 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/30 backdrop-blur-xl shadow-lg space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4 text-[#D4AF37]" /> Log Shared Expense
          </h4>

          <form onSubmit={handleAddExpense} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-300 uppercase">Description</label>
              <input
                type="text"
                placeholder="e.g. Lunch at Food Mall, Toll Pay"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[#051124] border border-white/15 text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="1200"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 rounded-xl bg-[#051124] border border-white/15 text-white placeholder-gray-500 text-xs font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-300 uppercase">Paid By</label>
                <select
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#051124] border border-white/15 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
                >
                  {members.map((m) => (
                    <option key={m} value={m} className="bg-[#0B2B5C]">
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-300 uppercase">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 rounded-xl bg-[#051124] border border-white/15 text-white text-xs focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="Food" className="bg-[#0B2B5C]">Food & Snacks</option>
                <option value="Fuel" className="bg-[#0B2B5C]">Fuel & FastTag Toll</option>
                <option value="Stay" className="bg-[#0B2B5C]">Hotel & Stay</option>
                <option value="Activity" className="bg-[#0B2B5C]">Attraction Tickets</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#c49f27] text-[#0B2B5C] font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              Add Expense to Ledger
            </button>
          </form>
        </div>

        {/* Individual Balance & Settlement Summary */}
        <div className="lg:col-span-2 p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/30 backdrop-blur-xl shadow-lg space-y-4">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-emerald-400" /> 1-Click Settlement Summary
          </h4>

          {/* Member Balance Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(balances).map(([name, data]) => {
              const isOwed = data.netBalance > 0;
              return (
                <div key={name} className="p-3.5 rounded-xl border border-white/10 bg-[#051124]/50">
                  <div className="font-bold text-white text-xs">{name}</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Paid Total: ₹{data.paid}</div>
                  <div
                    className={`font-mono font-black text-xs mt-1 ${
                      isOwed ? "text-emerald-400" : data.netBalance < 0 ? "text-red-400" : "text-gray-400"
                    }`}
                  >
                    {isOwed
                      ? `+ ₹${Math.round(data.netBalance)} (Gets back)`
                      : data.netBalance < 0
                      ? `- ₹${Math.round(Math.abs(data.netBalance))} (Owes)`
                      : "Settled Up"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calculated Settlements */}
          <div className="pt-2">
            <h5 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Required Settlement Transfers:
            </h5>

            {settlements.length === 0 ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                All members are fully settled up! No transfers required.
              </div>
            ) : (
              <div className="space-y-2">
                {settlements.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-white/10 bg-[#051124]/60 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-400">{s.from}</span>
                      <span className="text-gray-400">pays</span>
                      <span className="font-bold text-emerald-400">{s.to}</span>
                    </div>
                    <span className="font-mono font-black text-[#D4AF37] text-xs">
                      ₹{s.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#0B2B5C]/20 backdrop-blur-xl shadow-lg space-y-4">
        <h4 className="font-bold text-white text-sm uppercase tracking-wider">
          Recorded Expense History ({expenses.length})
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#051124]/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-3">Expense</th>
                <th className="p-3">Category</th>
                <th className="p-3">Paid By</th>
                <th className="p-3">Amount</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-white/5 transition-all">
                  <td className="p-3 font-semibold text-white">{exp.description}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] bg-white/10 text-gray-300">
                      {exp.category}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 font-semibold">{exp.paidBy}</td>
                  <td className="p-3 font-mono font-bold text-[#D4AF37]">₹{exp.amount}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GroupTripLedger;
