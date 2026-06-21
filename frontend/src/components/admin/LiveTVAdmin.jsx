import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, Radio } from 'lucide-react';

export default function LiveTVAdmin({ channels, fetchAdminData, setMessage }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Devotional', streamUrl: '', thumbnail: '' });

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/channels', form, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Channel added successfully!' });
      setShowModal(false);
      setForm({ title: '', category: 'Devotional', streamUrl: '', thumbnail: '' });
      fetchAdminData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add channel' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this channel?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/channels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Channel deleted' });
      fetchAdminData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete channel' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-devotion-gold">Live TV Channels</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/15 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Channel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-gray-400">
                <th className="pb-4 pr-4 font-black">Channel</th>
                <th className="pb-4 pr-4 font-black">Category</th>
                <th className="pb-4 pr-4 font-black">Status</th>
                <th className="pb-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {channels.map(channel => (
                <tr key={channel._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <img src={channel.thumbnail} alt={channel.title} className="w-12 h-12 rounded object-cover" />
                      <span className="text-sm font-black text-white">{channel.title}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-sm text-gray-300">{channel.category}</td>
                  <td className="py-4 pr-4 text-sm">
                    {channel.isLive ? <span className="text-green-400 font-bold flex items-center gap-1"><Radio className="w-3 h-3" /> LIVE</span> : <span className="text-gray-500">Offline</span>}
                  </td>
                  <td className="py-4 text-right">
                    <button onClick={() => handleDelete(channel._id)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6">
              <h3 className="text-xl font-black text-white mb-6 uppercase tracking-widest">Add Live Channel</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <input
                  type="text" placeholder="Channel Title" required
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-devotion-gold outline-none"
                />
                <select
                  value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                >
                  {['Sports', 'News', 'Devotional', 'Entertainment', 'Music', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  type="text" placeholder="HLS Stream URL (.m3u8)" required
                  value={form.streamUrl} onChange={e => setForm({ ...form, streamUrl: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                />
                <input
                  type="text" placeholder="Thumbnail Image URL" required
                  value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                />
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-400 hover:text-white font-black uppercase text-xs">Cancel</button>
                  <button type="submit" disabled={loading} className="px-5 py-2 bg-devotion-gold text-black rounded-xl font-black uppercase text-xs hover:bg-yellow-500">
                    {loading ? 'Adding...' : 'Add Channel'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
