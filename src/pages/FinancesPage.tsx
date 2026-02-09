import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, ArrowUpRight, ArrowDownRight, Trash2 } from 'lucide-react';
import { api } from '@/services/api';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FinancesPage() {
  const queryClient = useQueryClient();
  const [transactionOpen, setTransactionOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('expense');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDescription, setTxDescription] = useState('');

  const transactionsQuery = useQuery({
    queryKey: ['finances', 'transactions'],
    queryFn: () => api.finances.transactions(),
    staleTime: 30_000,
  });

  const summaryQuery = useQuery({
    queryKey: ['finances', 'summary'],
    queryFn: () => api.finances.summary(30),
    staleTime: 60_000,
  });

  const budgetsQuery = useQuery({
    queryKey: ['finances', 'budgets'],
    queryFn: api.finances.budgets,
    staleTime: 60_000,
  });

  const createTransactionMutation = useMutation({
    mutationFn: (data: { type: string; amount: number; category: string; description?: string }) =>
      api.finances.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
      setTransactionOpen(false);
      setTxAmount('');
      setTxCategory('');
      setTxDescription('');
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/finances/transactions/${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finances'] });
    },
  });

  const transactions = transactionsQuery.data ?? [];
  const summary = summaryQuery.data;
  const budgets = budgetsQuery.data ?? [];

  const handleCreateTransaction = () => {
    createTransactionMutation.mutate({
      type: txType,
      amount: Number(txAmount),
      category: txCategory,
      description: txDescription || undefined,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const expenseCategories = ['food', 'transport', 'entertainment', 'utilities', 'shopping', 'health', 'other'];
  const incomeCategories = ['salary', 'freelance', 'investment', 'gift', 'other'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Finances</h1>
          <p className="text-sm text-muted-foreground mt-1">Track income, expenses, and budgets</p>
        </div>
        <Dialog open={transactionOpen} onOpenChange={setTransactionOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Transaction</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={txType === 'expense' ? 'default' : 'outline'}
                  onClick={() => setTxType('expense')}
                  className="flex-1"
                >
                  Expense
                </Button>
                <Button
                  type="button"
                  variant={txType === 'income' ? 'default' : 'outline'}
                  onClick={() => setTxType('income')}
                  className="flex-1"
                >
                  Income
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={txCategory} onValueChange={setTxCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(txType === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What was this for?"
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={handleCreateTransaction}
                disabled={createTransactionMutation.isPending || !txAmount || !txCategory}
                className="w-full"
              >
                {createTransactionMutation.isPending ? 'Saving...' : 'Add Transaction'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.net_balance ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Net Balance</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp size={18} className="text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.total_income ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Income (30 days)</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <TrendingDown size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(summary?.total_expenses ?? 0)}</p>
              <p className="text-xs text-muted-foreground">Expenses (30 days)</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl border border-border bg-card"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <PiggyBank size={18} className="text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{summary?.savings_rate?.toFixed(0) ?? 0}%</p>
              <p className="text-xs text-muted-foreground">Savings Rate</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No transactions yet. Start tracking your spending!</p>
            ) : (
              transactions.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 group">
                  <div className={`p-2 rounded-lg ${tx.type === 'income' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                    {tx.type === 'income' ? (
                      <ArrowUpRight size={16} className="text-green-500" />
                    ) : (
                      <ArrowDownRight size={16} className="text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize">{tx.category}</p>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteTransactionMutation.mutate(tx.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Budgets */}
        <div className="p-5 rounded-xl border border-border bg-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Budgets</h3>
          <div className="space-y-4">
            {budgets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No budgets set</p>
            ) : (
              budgets.map((budget: any) => (
                <div key={budget.id}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground capitalize">{budget.category}</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min((budget.spent / budget.limit) * 100, 100)}
                    className={`h-2 ${budget.spent > budget.limit ? '[&>div]:bg-red-500' : ''}`}
                  />
                </div>
              ))
            )}
          </div>
          {summary?.top_category && (
            <div className="pt-4 mt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Top spending: <span className="text-foreground capitalize">{summary.top_category}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
