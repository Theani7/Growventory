import { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, FolderTree, X, Sprout, Package, MoreVertical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Categories = () => {
  const { user } = useAuth();
  const isAdmin = user?.role_name === 'admin';
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ category_name: '', description: '' });

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const handleFocus = () => fetchCategories();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory.category_id}`, formData);
        toast.success('Category updated');
      } else {
        await api.post('/categories', formData);
        toast.success('Category added');
      }
      setShowModal(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category) => {
    try {
      await api.delete(`/categories/${category.category_id}`);
      toast.success('Category deleted');
      setDeleteTarget(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cannot delete category');
    }
  };

  const resetForm = () => {
    setFormData({ category_name: '', description: '' });
    setEditingCategory(null);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({ category_name: category.category_name, description: category.description || '' });
    setShowModal(true);
  };

  // Modern accent palette
  const accents = [
    { bg: 'bg-moss-50', text: 'text-moss-700', ring: 'ring-moss-200', dot: 'bg-moss-500' },
    { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200', dot: 'bg-blue-500' },
    { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', dot: 'bg-amber-500' },
    { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200', dot: 'bg-purple-500' },
    { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', dot: 'bg-rose-500' },
    { bg: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', dot: 'bg-teal-500' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200', dot: 'bg-indigo-500' },
    { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', dot: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Library</p>
          <h1 className="page-title mt-1">Categories</h1>
          <p className="page-subtitle">Organize your plants into meaningful groups</p>
        </div>
        {isAdmin && (
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Category
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderTree className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 font-display">No categories yet</h3>
          <p className="text-sm text-ink-500 mt-1 mb-6">Create your first category to organize plants.</p>
          {isAdmin && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> New Category
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category, index) => {
            const a = accents[index % accents.length];
            return (
              <div key={category.category_id} className="card card-hover p-5 group relative overflow-hidden">
                <div className={`absolute -top-12 -right-12 w-32 h-32 ${a.bg} rounded-full opacity-60`}></div>
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-2xl ${a.bg} ${a.text} ring-1 ${a.ring} flex items-center justify-center`}>
                      <FolderTree className="w-5 h-5" strokeWidth={2.2} />
                    </div>
                    {isAdmin && (
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(category)} className="btn-icon" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(category)} className="btn-icon hover:!text-red-600 hover:!bg-red-50" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-ink-900 text-base font-display tracking-tight">{category.category_name}</h3>
                  {category.description && (
                    <p className="text-sm text-ink-500 mt-1 line-clamp-2 min-h-[2.5rem]">{category.description}</p>
                  )}
                  {!category.description && <div className="min-h-[2.5rem]"></div>}
                  <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-ink-100">
                    <div>
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-ink-500 mb-0.5">
                        <Sprout className="w-3 h-3" /> Plants
                      </div>
                      <p className="text-lg font-extrabold text-ink-900 tabular-nums">{category.plant_count || 0}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wide font-semibold text-ink-500 mb-0.5">
                        <Package className="w-3 h-3" /> Stock
                      </div>
                      <p className="text-lg font-extrabold text-ink-900 tabular-nums">{category.total_stock || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
                <p className="text-xs text-ink-500 mt-0.5">Categories help organize your plants</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" required value={formData.category_name} onChange={(e) => setFormData({ ...formData, category_name: e.target.value })} className="input-field" placeholder="e.g. Indoor Plants" />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field" rows="3" placeholder="Optional description..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 ring-1 ring-red-100 rounded-xl flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Delete Category</h2>
                  <p className="text-xs text-ink-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 ring-1 ring-red-100">
                <p className="font-bold text-ink-900">{deleteTarget.category_name}</p>
                {deleteTarget.description && <p className="text-sm text-ink-600 mt-0.5">{deleteTarget.description}</p>}
                <p className="text-sm text-ink-500 mt-1">{deleteTarget.plant_count || 0} plants in this category</p>
              </div>
              <p className="text-sm text-ink-600">Are you sure you want to delete this category? This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget)} className="btn-danger">Delete Category</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
