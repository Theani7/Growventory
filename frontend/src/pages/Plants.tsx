import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { FormEvent } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Plus, Search, Edit2, Trash2, Sprout, X, MapPin, Tag, Filter,
  LayoutGrid, List, ImageIcon, Upload, Download, FileSpreadsheet, HelpCircle
} from 'lucide-react';
import Tooltip from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import type { Category, Plant } from '../types';

const API_HOST = import.meta.env.VITE_API_BASE_URL?.startsWith('http') ? new URL(import.meta.env.VITE_API_BASE_URL).origin : '';

interface PlantFormData {
  name: string;
  scientific_name: string;
  category_id: string;
  current_stock: number | string;
  min_stock_threshold: number | string;
  purchase_price: number | string;
  selling_price: number | string;
  location: string;
  description: string;
  image: File | null;
  imagePreview: string | null;
}

const Plants = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isAdmin = user?.role_name?.toLowerCase() === 'admin';
  const canEdit = ['admin', 'staff', 'supervisor'].includes(user?.role_name?.toLowerCase() ?? '');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterHealth, setFilterHealth] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<PlantFormData>({
    name: '', scientific_name: '', category_id: '', current_stock: 0,
    min_stock_threshold: 0, purchase_price: '', selling_price: '', location: '', description: '', image: null,
    imagePreview: null
  });
  const plantFiltersRef = useRef({ search: '', category: '', health: '' });
  plantFiltersRef.current = { search, category: filterCategory, health: filterHealth };

  const buildPlantParams = () => {
    const { search: s, category, health } = plantFiltersRef.current;
    const params: Record<string, string> = {};
    if (s) params.search = s;
    if (category) params.category_id = category;
    if (health) params.health_status = health;
    return params;
  };

  useEffect(() => {
    return () => {
      if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imagePreview);
      }
    };
  }, [formData.imagePreview]);

  useEffect(() => {
    const urlSearch = searchParams.get('search');
    if (urlSearch) {
      fetchPlants({ search: urlSearch });
    } else {
      fetchPlants();
    }
    fetchCategories();
  }, [searchParams]);

  useEffect(() => {
    const handleFocus = () => { fetchPlants(buildPlantParams()); fetchCategories(); };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchPlants = async (params: Record<string, string> = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await api.get(`/plants${query ? `?${query}` : ''}`);
      setPlants(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch plants');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data.data || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
    }
  };

  const handleSearch = () => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (filterCategory) params.category_id = filterCategory;
    if (filterHealth) params.health_status = filterHealth;
    fetchPlants(params);
  };

  const clearFilters = () => {
    setSearch(''); setFilterCategory(''); setFilterHealth('');
    fetchPlants();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'imagePreview' && value !== null && value !== undefined) {
        if (typeof value === 'number') {
          form.append(key, String(value));
        } else {
          form.append(key, value as string | Blob);
        }
      }
    });
    try {
      if (editingPlant) {
        await api.put(`/plants/${editingPlant.plant_id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Plant updated successfully');
      } else {
        await api.post('/plants', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Plant added successfully');
      }
      setShowModal(false);
      resetForm();
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (plant: Plant) => {
    try {
      await api.delete(`/plants/${plant.plant_id}`);
      toast.success('Plant deleted');
      setDeleteTarget(null);
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Delete failed');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', scientific_name: '', category_id: '', current_stock: 0,
      min_stock_threshold: 0, purchase_price: '', selling_price: '', location: '', description: '', image: null,
      imagePreview: null
    });
    setEditingPlant(null);
  };

  const downloadExport = async () => {
    try {
      const response = await api.get('/reports/inventory-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plants_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Plants exported successfully');
    } catch (error) {
      toast.error('Failed to export plants');
    }
  };

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (!importFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a CSV file (.csv extension)');
      return;
    }

    setImporting(true);
    const formData = new FormData();
    formData.append('file', importFile);

    try {
      const response = await api.post('/plants/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(`Successfully imported ${response.data.data?.imported || 0} plants`);
      setShowImportModal(false);
      setImportFile(null);
      fetchPlants();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const openEditModal = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      name: plant.name || '',
      scientific_name: plant.scientific_name || '',
      category_id: String(plant.category_id || ''),
      current_stock: plant.current_stock || 0,
      min_stock_threshold: plant.min_stock_threshold || 0,
      purchase_price: plant.purchase_price || '',
      selling_price: plant.selling_price || '',
      location: plant.location || '',
      description: plant.description || '',
      image: null,
      imagePreview: plant.image_url ? `${API_HOST}${plant.image_url}` : null
    });
    setShowModal(true);
  };

  const getHealthBadge = (status: string) => {
    const map: Record<string, string> = {
      healthy: 'badge-success',
      under_observation: 'badge-warning',
      poor: 'badge-warning',
      critical: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  const formatHealth = (s?: string) => s?.replace('_', ' ') || 'Unknown';

  const hasActiveFilters = search || filterCategory || filterHealth;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Inventory</p>
          <h1 className="page-title mt-1">Plants</h1>
          <p className="page-subtitle">Manage your plant catalogue and track health</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="hidden sm:flex bg-white ring-1 ring-ink-200 rounded-xl p-1 shadow-sm">
            <Tooltip text="Grid view" position="bottom">
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition ${view === 'grid' ? 'bg-moss-600 text-white shadow-sm' : 'text-ink-500 hover:text-moss-700'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </Tooltip>
            <Tooltip text="Table view" position="bottom">
              <button
                onClick={() => setView('table')}
                className={`p-2 rounded-lg transition ${view === 'table' ? 'bg-moss-600 text-white shadow-sm' : 'text-ink-500 hover:text-moss-700'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </Tooltip>
          </div>
          <Tooltip text="Help & tips" position="bottom">
            <button onClick={() => setShowHelp(!showHelp)} className="btn-icon">
              <HelpCircle className="w-4 h-4" />
            </button>
          </Tooltip>
          {isAdmin && (
            <button onClick={() => setShowImportModal(true)} className="btn-secondary">
              <Upload className="w-4 h-4" /> Import
            </button>
          )}
          <button onClick={() => downloadExport()} className="btn-secondary">
            <Download className="w-4 h-4" /> Export
          </button>
          {canEdit && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary">
              <Plus className="w-4 h-4" /> Add Plant
            </button>
          )}
        </div>
      </div>

      {/* Help Section */}
      {showHelp && (
        <div className="card p-6 bg-gradient-to-br from-blue-50 via-white to-moss-50 ring-1 ring-blue-200/60">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-bold text-ink-900 mb-3 font-display">Plants Management Help</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">📊 Key Features</p>
                  <ul className="text-sm text-ink-600 space-y-1.5">
                    <li>• Add plants with images and details</li>
                    <li>• Track stock levels and thresholds</li>
                    <li>• Monitor plant health status</li>
                    <li>• Import/export CSV for bulk ops</li>
                    <li>• Search and filter by various criteria</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold text-ink-700 uppercase tracking-wider mb-2">💡 Tips</p>
                  <ul className="text-sm text-ink-600 space-y-1.5">
                    <li>• Use grid view for visual browsing</li>
                    <li>• Use table view for data analysis</li>
                    <li>• Set realistic minimum thresholds</li>
                    <li>• Update health status regularly</li>
                    <li>• Export data periodically for backup</li>
                  </ul>
                </div>
              </div>
            </div>
            <button onClick={() => setShowHelp(false)} className="btn-icon">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text"
              placeholder="Search by name, scientific name, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="input-field pl-10"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-700"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)} 
            className="input-field lg:w-48"
          >
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
          </select>
          
          <select 
            value={filterHealth} 
            onChange={(e) => setFilterHealth(e.target.value)} 
            className="input-field lg:w-44"
          >
            <option value="">All Health</option>
            <option value="healthy">Healthy</option>
            <option value="under_observation">Under Observation</option>
            <option value="poor">Poor</option>
            <option value="critical">Critical</option>
          </select>
          
          <div className="flex gap-2">
            <button onClick={handleSearch} className="btn-primary">
              <Filter className="w-4 h-4" /> Apply
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
        
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider">Active:</span>
              {search && (
                <span className="chip">
                  Search: "{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterCategory && (
                <span className="chip">
                  {categories.find(c => String(c.category_id) === filterCategory)?.category_name || 'Category'}
                  <button onClick={() => setFilterCategory('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {filterHealth && (
                <span className="chip capitalize">
                  {filterHealth.replace('_', ' ')}
                  <button onClick={() => setFilterHealth('')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
            <span className="text-xs font-semibold text-ink-500">
              {plants.length} {plants.length === 1 ? 'plant' : 'plants'} found
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-ink-200 border-t-moss-600"></div>
        </div>
      ) : plants.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sprout className="w-8 h-8 text-ink-400" />
          </div>
          <h3 className="text-lg font-bold text-ink-900 font-display">No plants yet</h3>
          <p className="text-sm text-ink-500 mt-1 mb-6">Get started by adding your first plant.</p>
          {canEdit && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary inline-flex">
              <Plus className="w-4 h-4" /> Add Plant
            </button>
          )}
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plants.map((plant) => (
            <div key={plant.plant_id} className="card card-hover overflow-hidden group">
              <div className="aspect-[4/3] bg-gradient-to-br from-moss-50 to-blue-50 relative overflow-hidden">
                {plant.image_url ? (
                  <img
                    src={`${API_HOST}${plant.image_url}`}
                    alt={plant.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sprout className="w-12 h-12 text-moss-300" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={`${getHealthBadge(plant.health_status || '')} backdrop-blur-md capitalize shadow-sm`}>
                    {formatHealth(plant.health_status)}
                  </span>
                </div>
                {plant.current_stock <= plant.min_stock_threshold && (
                  <div className="absolute top-3 left-3">
                    <span className="badge-warning backdrop-blur-md shadow-sm">Low</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-ink-900 truncate font-display">{plant.name}</h3>
                {plant.scientific_name && (
                  <p className="text-xs text-ink-500 italic truncate">{plant.scientific_name}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-ink-500">
                  {plant.category_name && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <Tag className="w-3 h-3" />{plant.category_name}
                    </span>
                  )}
                  {plant.location && (
                    <span className="inline-flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3" />{plant.location}
                    </span>
                  )}
                </div>
                <div className="flex items-end justify-between mt-4 pt-3 border-t border-ink-100">
                  <div>
                    <p className="text-[10px] text-ink-500 uppercase tracking-wider font-semibold">Stock</p>
                    <p className={`text-2xl font-extrabold tabular-nums ${plant.current_stock <= plant.min_stock_threshold ? 'text-amber-600' : 'text-ink-900'}`}>
                      {plant.current_stock}
                    </p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button onClick={() => openEditModal(plant)} className="btn-icon" title="Edit">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTarget(plant)}
                        className="btn-icon hover:!text-red-600 hover:!bg-red-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="table-modern min-w-full">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap">Plant</th>
                      <th className="whitespace-nowrap">Category</th>
                      <th className="whitespace-nowrap">Location</th>
                      <th className="whitespace-nowrap text-center">Stock</th>
                      <th className="whitespace-nowrap text-center">Health</th>
                      <th className="whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plants.map((plant) => (
                      <tr key={plant.plant_id}>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-moss-50 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                              {plant.image_url ? (
                                <img src={`${API_HOST}${plant.image_url}`} alt={plant.name} className="w-full h-full object-cover" />
                              ) : (
                                <Sprout className="w-5 h-5 text-moss-600" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-900 truncate">{plant.name}</p>
                              {plant.scientific_name && <p className="text-xs text-ink-500 italic truncate">{plant.scientific_name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">{plant.category_name || '-'}</td>
                        <td className="whitespace-nowrap">{plant.location || '-'}</td>
                        <td className="whitespace-nowrap text-center">
                          <span className={`font-bold tabular-nums ${plant.current_stock <= plant.min_stock_threshold ? 'text-amber-600' : 'text-ink-900'}`}>
                            {plant.current_stock}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-center">
                          <span className={`${getHealthBadge(plant.health_status || '')} capitalize`}>{formatHealth(plant.health_status)}</span>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex justify-center gap-1">
                            {canEdit && (
                              <button onClick={() => openEditModal(plant)} className="btn-icon min-h-[36px] min-w-[36px]">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            )}
                            {isAdmin && (
                              <button onClick={() => setDeleteTarget(plant)} className="btn-icon min-h-[36px] min-w-[36px] hover:!text-red-600 hover:!bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">{editingPlant ? 'Edit Plant' : 'New Plant'}</h2>
                <p className="text-xs text-ink-500 mt-0.5">{editingPlant ? 'Update plant details' : 'Add a new plant to your inventory'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="overflow-y-auto p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="label">Name *</label>
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input-field min-h-[44px]" />
                </div>
                <div>
                  <label className="label">Scientific Name</label>
                  <input type="text" value={formData.scientific_name || ''} onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })} className="input-field min-h-[44px]" placeholder="Latin name" />
                </div>
                <div>
                  <label className="label">Category *</label>
                  <select required value={formData.category_id} onChange={(e) => setFormData({ ...formData, category_id: e.target.value })} className="input-field min-h-[44px]">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input type="text" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="input-field min-h-[44px]" placeholder="e.g. Greenhouse A" />
                </div>
                <div>
                  <label className="label">Current Stock *</label>
                  <input type="number" required min="0" value={formData.current_stock} onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })} className="input-field min-h-[44px]" />
                </div>
                <div>
                  <label className="label">Min Threshold *</label>
                  <input type="number" required min="0" value={formData.min_stock_threshold} onChange={(e) => setFormData({ ...formData, min_stock_threshold: e.target.value })} className="input-field min-h-[44px]" />
                </div>
                <div>
                  <label className="label">Purchase Price</label>
                  <input type="number" step="0.01" value={formData.purchase_price || ''} onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })} className="input-field min-h-[44px]" placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Selling Price</label>
                  <input type="number" step="0.01" value={formData.selling_price || ''} onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })} className="input-field min-h-[44px]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="input-field min-h-[44px]" rows={3} placeholder="Optional notes about the plant" />
              </div>
              <div>
                <label className="label">Image</label>
                <div className="space-y-3">
                  {formData.imagePreview && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-ink-50 ring-1 ring-ink-100 group">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image: null, imagePreview: null });
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <label className="cursor-pointer flex items-center gap-3 px-4 py-3 ring-1 ring-dashed ring-ink-300 rounded-xl hover:ring-ink-900 hover:bg-ink-50 transition min-h-[44px]">
                    <ImageIcon className="w-5 h-5 text-ink-400" />
                    <span className="text-sm text-ink-600 flex-1 truncate">
                      {formData.image ? formData.image.name : 'Click to upload image (JPG, PNG, WEBP, GIF max 5MB)'}
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                        if (!allowed.includes(file.type)) {
                          toast.error('Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed.');
                          e.target.value = '';
                          return;
                        }
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error('Image too large. Maximum size is 5MB.');
                          e.target.value = '';
                          return;
                        }
                        
                        setFormData({
                          ...formData,
                          image: file,
                          imagePreview: URL.createObjectURL(file)
                        });
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </form>
            <div className="flex flex-col sm:flex-row gap-3 justify-end p-4 sm:p-5 border-t border-ink-100 bg-ink-50/40">
              <button type="button" onClick={() => setShowModal(false)} className="btn-secondary min-h-[44px] flex-1 sm:flex-none">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary min-h-[44px] flex-1 sm:flex-none" disabled={submitting}>
                {submitting ? 'Saving...' : editingPlant ? 'Update Plant' : 'Add Plant'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-backdrop flex items-center justify-center p-4">
          <div className="modal-panel w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-ink-100">
              <div>
                <h2 className="text-lg font-extrabold text-ink-900 font-display">Import Plants</h2>
                <p className="text-xs text-ink-500 mt-0.5">Upload a CSV file with plant data</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); }} className="btn-icon">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleImport} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="label">CSV File *</label>
                  <div className="ring-2 ring-dashed ring-ink-200 rounded-2xl p-8 text-center hover:ring-ink-400 transition">
                    <FileSpreadsheet className="w-12 h-12 text-ink-400 mx-auto mb-3" />
                    <p className="text-sm text-ink-600 mb-3">
                      {importFile ? <span className="font-semibold text-ink-900">{importFile.name}</span> : 'Drag & drop or click to select'}
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label htmlFor="csv-upload" className="btn-secondary cursor-pointer inline-flex">
                      <Upload className="w-4 h-4" /> Select File
                    </label>
                  </div>
                </div>
                
                <div className="bg-amber-50 ring-1 ring-amber-200 rounded-xl p-4">
                  <h4 className="font-bold text-amber-900 text-sm mb-2">CSV Format Requirements</h4>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>• <strong>Required:</strong> name, category_id, current_stock, min_stock_threshold</li>
                    <li>• <strong>Optional:</strong> scientific_name, location, purchase_price, selling_price, description</li>
                    <li>• <button type="button" onClick={downloadExport} className="font-semibold underline hover:no-underline">Download template</button></li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6 pt-5 border-t border-ink-100">
                <button type="button" onClick={() => { setShowImportModal(false); setImportFile(null); }} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={importing || !importFile}>
                  {importing ? 'Importing...' : 'Import Plants'}
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
                  <h2 className="text-lg font-extrabold text-ink-900 font-display">Delete Plant</h2>
                  <p className="text-xs text-ink-500 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <button onClick={() => setDeleteTarget(null)} className="btn-icon"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-red-50 rounded-xl p-4 ring-1 ring-red-100">
                <p className="font-bold text-ink-900">{deleteTarget.name}</p>
                {deleteTarget.scientific_name && <p className="text-sm text-ink-600 italic">{deleteTarget.scientific_name}</p>}
                <p className="text-sm text-ink-500 mt-1">Stock: {deleteTarget.current_stock}</p>
              </div>
              <div className="bg-amber-50 rounded-xl p-4 ring-1 ring-amber-200">
                <p className="text-sm text-amber-800 font-semibold">⚠️ Warning</p>
                <p className="text-xs text-amber-700 mt-1">
                  Deleting this plant will permanently remove all associated data including stock movements and health logs.
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancel</button>
                <button onClick={() => handleDelete(deleteTarget)} className="btn-danger">Delete Plant</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plants;
