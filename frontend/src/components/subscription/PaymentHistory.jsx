import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { CreditCard, CheckCircle, AlertTriangle, FileText } from 'lucide-react';
import { ENV } from '../../config/env';

export default function PaymentHistory() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get('/api/subscription/history', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTransactions(res.data.transactions || []);
        }
      } catch (err) {
        console.error('Error fetching transaction history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return <div className="text-zinc-500 py-4 text-center">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <div className="text-zinc-500 py-6 text-center bg-zinc-900/20 rounded-xl border border-zinc-850">
        <CreditCard className="w-12 h-12 mx-auto mb-2 text-zinc-600" />
        <p>No billing transactions found.</p>
      </div>
    );
  }

  const token = localStorage.getItem('token');

  return (
    <div className="space-y-3">
      {transactions.map((tx) => (
        <div key={tx._id} className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-800 rounded-lg text-zinc-300">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm">{tx.planName}</h4>
              <p className="text-xs text-zinc-400">{new Date(tx.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end gap-1.5">
              <span className="font-bold text-sm">₹{tx.amount / 100}</span>
              {tx.status === 'paid' && token && (
                <a
                  href={`${ENV.API_BASE_URL || ''}/api/subscription/invoice/${tx._id}?token=${token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 text-xs flex items-center gap-1 font-semibold transition"
                >
                  <FileText className="w-3.5 h-3.5" /> Invoice
                </a>
              )}
            </div>
            <div className="flex items-center gap-1">
              {tx.status === 'paid' ? (
                <span className="flex items-center gap-0.5 text-xs font-bold text-emerald-500 bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3.5 h-3.5" /> Success
                </span>
              ) : (
                <span className="flex items-center gap-0.5 text-xs font-bold text-rose-500 bg-rose-950/40 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> Failed
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
