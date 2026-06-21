import React from 'react';
import { Users, Plus, MessageCircle, Heart, Search, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSatsangs } from '../hooks/useSatsangs';

export default function Satsangs() {
  const navigate = useNavigate();
  const {
    user,
    groups,
    loading,
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    editingGroup,
    setEditingGroup,
    handleEditGroup,
    activeGroupId,
    setActiveGroupId,
    activeGroupPosts,
    postContent,
    setPostContent,
    newGroupForm,
    setNewGroupForm,
    activeCommentsPostId,
    setActiveCommentsPostId,
    commentInputs,
    setCommentInputs,
    handleCreateGroup,
    handleDeleteGroup,
    handleCreatePost,
    handleLike,
    handleCommentSubmit,
    handleDeleteComment,
    handleDeletePost,
    activeGroup,
    getInitials
  } = useSatsangs();

  return (
    <div className="min-h-screen pt-20 sm:pt-28 tv:pt-36 pb-16 sm:pb-12 px-4 sm:px-6 tv:px-16 relative bg-[#06101E] text-white">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.08),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(122,46,46,0.2),transparent_28%)]"></div>
      
      <div className="max-w-7xl tv:max-w-[1800px] mx-auto relative z-10">
        <div className="mb-8 sm:mb-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl tv:text-[8rem] font-black font-serif text-devotion-gold tracking-tight mb-4">Satsangs</h1>
            <p className="text-gray-400 font-medium max-w-2xl tv:max-w-4xl mx-auto text-sm sm:text-base tv:text-xl">Join spiritual communities, ask deep questions, and share your wisdom with fellow seekers on the path.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 tv:grid-cols-5 gap-6 sm:gap-8 tv:gap-12">
          
          {/* Sidebar / Groups List */}
          <div className="lg:col-span-1 border-r border-white/10 pr-0 lg:pr-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold uppercase tracking-widest text-xs text-gray-400">Communities</h3>
              {user && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="tv-focusable bg-devotion-gold text-devotion-darkBlue hover:bg-yellow-400 font-black text-[10px] tv:text-sm uppercase tracking-widest px-3 py-1.5 tv:px-5 tv:py-2.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3 h-3 tv:w-5 tv:h-5" /> Create
                </button>
              )}
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-xl"></div>)}
              </div>
            ) : groups.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <Users className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-400">No communities yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groups.map(group => (
                  <button
                    key={group._id}
                    tabIndex={0}
                    onClick={() => setActiveGroupId(group._id)}
                    className={`tv-focusable focus:outline-none focus:ring-4 focus:ring-devotion-gold w-full text-left p-4 tv:p-6 rounded-2xl transition-all border preserve-3d ${activeGroupId === group._id ? 'bg-gradient-to-r from-devotion-gold/20 to-devotion-gold/5 border-devotion-gold/50 shadow-lg' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                    onMouseMove={(e) => {
                      const card = e.currentTarget;
                      const rect = card.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const centerX = rect.width / 2;
                      const centerY = rect.height / 2;
                      const rotateX = ((y - centerY) / centerY) * -5;
                      const rotateY = ((x - centerX) / centerX) * 5;
                      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
                    }}
                  >
                     <h4 className={`font-bold ${activeGroupId === group._id ? 'text-devotion-gold' : 'text-white'}`} style={{ transform: 'translateZ(20px)' }}>{group.name}</h4>
                     <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{group.category}</p>
                     {(user?.role === 'admin' || (user && group.createdBy && String(user.id || user._id) === String(group.createdBy))) && (
                        <div className="flex gap-2 mt-3">
                           <button
                             onClick={(e) => { e.stopPropagation(); setEditingGroup(group); setShowEditModal(true); }}
                             className="inline-flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 uppercase font-black tracking-widest bg-blue-400/10 px-2 py-1 rounded-md transition-colors"
                           >
                             <Pencil className="w-3 h-3" /> Edit
                           </button>
                           <button
                             onClick={(e) => handleDeleteGroup(e, group._id)}
                             className="inline-flex items-center gap-1.5 text-[10px] text-red-400 hover:text-red-300 uppercase font-black tracking-widest bg-red-400/10 px-2 py-1 rounded-md transition-colors"
                           >
                             <Trash2 className="w-3 h-3" /> Delete
                           </button>
                        </div>
                     )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3">
            {activeGroup ? (
               <div>
                  <div className="bg-glass-gradient border border-devotion-gold/20 rounded-3xl p-6 md:p-8 mb-8 backdrop-blur-md">
                     <h2 className="text-3xl font-black text-white mb-2">{activeGroup.name}</h2>
                     <p className="text-gray-300 font-medium max-w-3xl">{activeGroup.description}</p>
                  </div>

                  {user ? (
                    <form onSubmit={handleCreatePost} className="mb-8 relative">
                      <textarea
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                        placeholder="Share a thought, ask a question, or reflect on a sloka..."
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-6 text-white placeholder:text-gray-500 focus:border-devotion-gold/50 transition-colors focus:outline-none min-h-[120px]"
                      />
                      <button 
                        type="submit"
                        disabled={!postContent.trim()}
                        className="tv-focusable absolute bottom-4 right-4 bg-devotion-gold text-devotion-darkBlue px-6 py-2 tv:px-8 tv:py-3 rounded-xl font-bold uppercase tracking-widest text-xs tv:text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50"
                      >
                        Post
                      </button>
                    </form>
                  ) : (
                    <div className="mb-8 p-6 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-center">
                      <p className="text-blue-200 text-sm font-medium">Please <button onClick={() => navigate('/login')} className="text-devotion-gold underline">log in</button> to participate in the Satsang.</p>
                    </div>
                  )}

                  <div className="space-y-6">
                     {activeGroupPosts.length === 0 ? (
                       <div className="text-center py-12 text-gray-500">
                         <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                         <p>No discussions in this Satsang yet. Be the first!</p>
                       </div>
                     ) : (
                       activeGroupPosts.map(post => (
                         <div key={post._id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                             <div className="flex justify-between items-start mb-4">
                               <div className="flex items-center gap-3">
                                  {post.authorImage ? (
                                    <img src={post.authorImage} alt="User" className="w-10 h-10 rounded-full object-cover border border-devotion-gold/30" />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-bold text-xs uppercase text-white border border-gray-600">
                                      {getInitials(post.authorName)}
                                    </div>
                                  )}
                                  <div>
                                    <p className="font-bold text-white text-sm">{post.authorName}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                                  </div>
                               </div>
                               {(user?.role === 'admin' || String(post.authorId) === String(user?.id || user?._id)) && (
                                  <button
                                    onClick={() => handleDeletePost(post._id)}
                                    className="text-red-400 hover:text-red-300 bg-red-400/10 p-2 rounded-lg transition-colors"
                                    title="Delete post"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                               )}
                             </div>
                            
                            <p className="text-gray-200 mb-6 whitespace-pre-wrap">{post.content}</p>
                            
                            <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                               <button 
                                 onClick={() => handleLike(post._id)}
                                 className={`tv-focusable flex items-center gap-2 text-xs tv:text-sm font-bold transition-colors ${post.likes?.includes(user?.id || user?._id) ? 'text-red-400' : 'text-gray-400 hover:text-red-400'}`}
                               >
                                  <Heart className={`w-4 h-4 tv:w-5 tv:h-5 ${post.likes?.includes(user?.id || user?._id) ? 'fill-current' : ''}`} /> 
                                  {post.likes?.length || 0}
                               </button>
                               <button 
                                 onClick={() => setActiveCommentsPostId(activeCommentsPostId === post._id ? null : post._id)}
                                 className="tv-focusable flex items-center gap-2 text-xs tv:text-sm font-bold text-gray-400 hover:text-white"
                               >
                                  <MessageCircle className="w-4 h-4 tv:w-5 tv:h-5" />
                                  {post.comments?.length || 0}
                               </button>
                            </div>
                            
                            {activeCommentsPostId === post._id && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                {user && (
                                  <div className="flex gap-2 mb-4">
                                    <input
                                      value={commentInputs[post._id] || ''}
                                      onChange={(e) => setCommentInputs({ ...commentInputs, [post._id]: e.target.value })}
                                      placeholder="Write a comment..."
                                      className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-devotion-gold/50"
                                    />
                                    <button
                                      onClick={() => handleCommentSubmit(post._id)}
                                      disabled={!commentInputs[post._id]?.trim()}
                                      className="bg-devotion-gold text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-yellow-400 disabled:opacity-50"
                                    >
                                      Send
                                    </button>
                                  </div>
                                )}
                                <div className="space-y-3 max-h-60 overflow-y-auto no-scrollbar">
                                  {post.comments?.map(comment => (
                                    <div key={comment._id || comment.id} className="bg-black/20 rounded-xl p-3 border border-white/5">
                                      <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                          {comment.authorImage ? (
                                            <img src={comment.authorImage} alt="User" className="w-6 h-6 rounded-full object-cover border border-devotion-gold/30" />
                                          ) : (
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center font-bold text-[8px] uppercase text-white">
                                              {getInitials(comment.authorName)}
                                            </div>
                                          )}
                                          <p className="font-bold text-xs text-devotion-gold">{comment.authorName}</p>
                                        </div>
                                        {(String(comment.authorId) === String(user?.id || user?._id) || user?.role === 'admin') && (
                                          <button
                                            onClick={() => handleDeleteComment(post._id, comment._id || comment.id)}
                                            className="text-red-400 hover:text-red-300 transition-colors"
                                            title="Delete comment"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                      <p className="text-gray-300 text-xs mt-2">{comment.text}</p>
                                    </div>
                                  ))}
                                  {(!post.comments || post.comments.length === 0) && (
                                    <p className="text-xs text-gray-500 text-center py-2">No comments yet.</p>
                                  )}
                                </div>
                              </div>
                            )}
                         </div>
                       ))
                     )}
                  </div>
               </div>
            ) : (
               <div className="h-96 flex items-center justify-center border-2 border-dashed border-white/10 rounded-3xl">
                  <p className="text-gray-500 font-medium">Select a community from the sidebar to view discussions.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-[#081426] border border-devotion-gold/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                 <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <h3 className="text-2xl font-bold font-serif text-white mb-6">Create Satsang</h3>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold mb-2 block">Community Name</label>
                    <input 
                      required
                      value={newGroupForm.name}
                      onChange={e => setNewGroupForm({...newGroupForm, name: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-devotion-gold focus:outline-none"
                      placeholder="e.g. Chapter 2 Seekers"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold mb-2 block">Description</label>
                    <textarea 
                      required
                      value={newGroupForm.description}
                      onChange={e => setNewGroupForm({...newGroupForm, description: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-devotion-gold focus:outline-none min-h-[100px]"
                      placeholder="What is the purpose of this community?"
                    />
                 </div>
                 <button type="submit" className="w-full bg-devotion-gold text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4">
                    Create Community
                 </button>
              </form>
           </div>
        </div>
      )}

      {showEditModal && editingGroup && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-[#081426] border border-devotion-gold/30 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
              <button 
                onClick={() => { setShowEditModal(false); setEditingGroup(null); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                 <ChevronRight className="w-6 h-6 rotate-180" />
              </button>
              <h3 className="text-2xl font-bold font-serif text-white mb-6">Edit Satsang</h3>
              <form onSubmit={(e) => handleEditGroup(e, editingGroup._id, { name: editingGroup.name, description: editingGroup.description })} className="space-y-4">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold mb-2 block">Community Name</label>
                    <input 
                      required
                      value={editingGroup.name}
                      onChange={e => setEditingGroup({...editingGroup, name: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-devotion-gold focus:outline-none"
                      placeholder="e.g. Chapter 2 Seekers"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-devotion-gold mb-2 block">Description</label>
                    <textarea 
                      required
                      value={editingGroup.description}
                      onChange={e => setEditingGroup({...editingGroup, description: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-devotion-gold focus:outline-none min-h-[100px]"
                      placeholder="What is the purpose of this community?"
                    />
                 </div>
                 <button type="submit" className="w-full bg-devotion-gold text-black font-black uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-yellow-400 transition-colors mt-4">
                    Save Changes
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
