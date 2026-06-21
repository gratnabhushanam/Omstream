import React, { useState } from 'react';
import axios from 'axios';
import { Plus, Trash2, ListMusic } from 'lucide-react';

export default function PlaylistsAdmin({ playlists, songs, fetchAdminData, setMessage }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', coverImage: '', selectedSongs: [] });

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/playlists', {
        title: form.title,
        description: form.description,
        coverImage: form.coverImage,
        songs: form.selectedSongs,
        isFeatured: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Playlist created successfully!' });
      setShowModal(false);
      setForm({ title: '', description: '', coverImage: '', selectedSongs: [] });
      fetchAdminData();
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create playlist' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this playlist?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/playlists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage({ type: 'success', text: 'Playlist deleted' });
      fetchAdminData();
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to delete playlist' });
    }
  };

  const toggleSong = (songId) => {
    setForm(prev => {
      const isSelected = prev.selectedSongs.includes(songId);
      if (isSelected) {
        return { ...prev, selectedSongs: prev.selectedSongs.filter(id => id !== songId) };
      } else {
        return { ...prev, selectedSongs: [...prev.selectedSongs, songId] };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-glass-premium backdrop-blur-3xl rounded-[2.5rem] border border-devotion-gold/20 p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-widest text-devotion-gold">Manage Playlists</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-white/10 border border-white/20 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/15 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Playlist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map(playlist => (
            <div key={playlist._id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-devotion-gold transition-colors">
              <div className="h-40 overflow-hidden relative">
                <img src={playlist.coverImage || '/default_playlist.png'} alt={playlist.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                  <h3 className="text-white font-black text-lg">{playlist.title}</h3>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {playlist.songs?.length || 0} songs
                </div>
                <button onClick={() => handleDelete(playlist._id)} className="text-red-400 hover:text-red-300 bg-white/5 p-2 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-black text-white uppercase tracking-widest">Create New Playlist</h3>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="playlist-form" onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text" placeholder="Playlist Title" required
                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-devotion-gold outline-none"
                  />
                  <input
                    type="text" placeholder="Description"
                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                    className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  />
                  <input
                    type="text" placeholder="Cover Image URL" required
                    value={form.coverImage} onChange={e => setForm({ ...form, coverImage: e.target.value })}
                    className="col-span-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none"
                  />
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wider">Select Songs</h4>
                  <div className="bg-black/50 border border-white/5 rounded-xl p-4 max-h-60 overflow-y-auto space-y-2">
                    {songs.map(song => (
                      <label key={song._id} className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <input
                          type="checkbox"
                          checked={form.selectedSongs.includes(song._id)}
                          onChange={() => toggleSong(song._id)}
                          className="w-4 h-4 rounded border-gray-600 text-devotion-gold focus:ring-devotion-gold bg-zinc-800"
                        />
                        <img src={song.coverImage || '/default_cover.png'} className="w-8 h-8 rounded object-cover" alt="" />
                        <span className="text-white text-sm">{song.title}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-zinc-950">
              <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-400 hover:text-white font-black uppercase text-xs">Cancel</button>
              <button type="submit" form="playlist-form" disabled={loading} className="px-5 py-2 bg-devotion-gold text-black rounded-xl font-black uppercase text-xs hover:bg-yellow-500">
                {loading ? 'Creating...' : 'Create Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
