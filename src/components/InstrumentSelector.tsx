import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Anchor,
  Circle,
  Cloud,
  Compass,
  Disc,
  Download,
  Feather,
  Flame,
  Globe,
  Music,
  Piano,
  Play,
  Radio,
  Save,
  Search,
  Shuffle,
  Sliders,
  Sparkles,
  Star,
  Sun,
  Tag,
  Trash2,
  Upload,
  Volume2,
  Wind,
  Zap,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { FACTORY_INSTRUMENTS } from '../audio/synthesis/instruments';
import { PresetStashManager, StashPreset } from '../audio/synthesis/PresetStash';
import { InstrumentCategory, InstrumentPreset } from '../types/audio';

interface InstrumentSelectorProps {
  onSelectCustomTab?: () => void;
}

const CATEGORY_TABS: Array<{ id: InstrumentCategory | 'all' | 'stash' | 'favorites'; label: string; badge?: string }> = [
  { id: 'all', label: 'All Vault' },
  { id: 'stash', label: '⚡ Producer Stash (808s & Hits)', badge: 'HOT' },
  { id: 'favorites', label: '★ Favorites' },
  { id: 'synths', label: '808s & Synths' },
  { id: 'keyboards', label: 'Keys & Neo-Soul' },
  { id: 'world', label: 'World & Ethnic' },
  { id: 'strings', label: 'Strings & Orchestral' },
  { id: 'guitars', label: 'Guitars & Plucks' },
  { id: 'percussion', label: 'Percussion' },
  { id: 'custom', label: 'Custom Sampler' },
];

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({ onSelectCustomTab }) => {
  const engine = AudioEngine.getInstance();
  const stashManager = PresetStashManager.getInstance();
  const [selectedCategory, setSelectedCategory] = useState<InstrumentCategory | 'all' | 'stash' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [allPresets, setAllPresets] = useState<StashPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveAuthor, setSaveAuthor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshPresets = () => {
    setAllPresets(stashManager.getAllPresets());
  };

  useEffect(() => {
    refreshPresets();
  }, []);

  const renderIcon = (iconName: string) => {
    const props = { className: 'w-4 h-4' };
    switch (iconName) {
      case 'Piano': return <Piano {...props} />;
      case 'Radio': return <Radio {...props} />;
      case 'Disc': return <Disc {...props} />;
      case 'Sparkles': return <Sparkles {...props} />;
      case 'Music': return <Music {...props} />;
      case 'Flame': return <Flame {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Feather': return <Feather {...props} />;
      case 'Compass': return <Compass {...props} />;
      case 'Wind': return <Wind {...props} />;
      case 'Volume2': return <Volume2 {...props} />;
      case 'Anchor': return <Anchor {...props} />;
      case 'Sun': return <Sun {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Cloud': return <Cloud {...props} />;
      case 'Sliders': return <Sliders {...props} />;
      case 'Play': return <Play {...props} />;
      case 'Circle': return <Circle {...props} />;
      default: return <Music {...props} />;
    }
  };

  const handleSelectInstrument = (inst: InstrumentPreset) => {
    engine.currentInstrument = inst;
    engine.notifyStateChange();
    // Audition sound
    const auditionNote = inst.synthesisType === 'sub_808' || inst.synthesisType === 'analog_bass' ? 48 : 60;
    engine.playNote(auditionNote, 0.82);
    setTimeout(() => engine.stopNote(auditionNote), 450);
  };

  const handleToggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    stashManager.toggleFavorite(id);
    refreshPresets();
  };

  const handleRandomize = () => {
    if (allPresets.length === 0) return;
    const rand = allPresets[Math.floor(Math.random() * allPresets.length)];
    handleSelectInstrument(rand);
  };

  const handleSaveCurrentToStash = () => {
    if (!saveName.trim()) return;
    const current = engine.currentInstrument;
    const customPatch: InstrumentPreset = {
      ...current,
      name: saveName.trim(),
    };
    stashManager.saveCustomPreset(customPatch, saveAuthor.trim() || 'Producer');
    setShowSaveDialog(false);
    setSaveName('');
    refreshPresets();
  };

  const handleDeleteCustom = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    stashManager.deleteCustomPreset(id);
    refreshPresets();
  };

  const handleExportBank = () => {
    const json = stashManager.exportBankAsJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `COOKUP_PresetBank_${Date.now()}.cookup`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBank = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const added = stashManager.importBankFromJson(content);
      refreshPresets();
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Filter instruments
  const filteredInstruments = allPresets.filter((inst) => {
    if (selectedCategory === 'favorites' && !inst.isFavorite) return false;
    if (selectedCategory === 'stash') {
      const isStashItem = inst.tags?.some((t) => ['808', 'Trap', 'Drill', 'Hyperpop', 'Lo-Fi', 'Custom'].includes(t));
      if (!isStashItem && !inst.isCustom) return false;
    } else if (selectedCategory !== 'all' && selectedCategory !== 'favorites') {
      if (inst.category !== selectedCategory) return false;
    }

    if (activeTag && !inst.tags?.includes(activeTag)) return false;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    return (
      inst.name.toLowerCase().includes(query) ||
      inst.origin.toLowerCase().includes(query) ||
      inst.description.toLowerCase().includes(query) ||
      inst.tags?.some((t) => t.toLowerCase().includes(query)) ||
      inst.author?.toLowerCase().includes(query)
    );
  });

  // Extract popular tags
  const popularTags = Array.from(
    new Set(allPresets.flatMap((p) => p.tags || []))
  ).slice(0, 8);

  return (
    <div id="instrument-selector-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      {/* Top Controls: Search, Bank Export/Import, Save & Randomizer */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            id="instrument-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 808s, Rhodes, Plucks, Flutes, Tags (e.g. Drill, SZA, 808)..."
            className="w-full bg-[#18181B] border border-[#28282A] rounded-lg pl-9 pr-4 py-2 text-xs text-[#E0E0E0] placeholder-[#71717A] focus:outline-none focus:border-[#7C5DFF] transition-colors"
          />
        </div>

        {/* Action Buttons: Save Custom, Import/Export Bank, Randomizer */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSaveName(`${engine.currentInstrument.name} (Custom)`);
              setShowSaveDialog(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C5DFF]/20 border border-[#7C5DFF]/50 hover:bg-[#7C5DFF]/30 text-[#C4B5FD] text-xs font-bold transition-all shadow-[0_0_10px_rgba(124,93,255,0.2)]"
            title="Save current tweaked sound to your personal Stash"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save to Stash</span>
          </button>

          <button
            onClick={handleExportBank}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#18181B] border border-[#28282A] hover:bg-[#232326] text-[#9E9E9E] hover:text-[#F0F0F0] text-xs font-semibold transition-all"
            title="Export preset stash bank as .cookup JSON pack"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Bank</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-[#18181B] border border-[#28282A] hover:bg-[#232326] text-[#9E9E9E] hover:text-[#F0F0F0] text-xs font-semibold transition-all"
            title="Import .cookup preset pack"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBank}
            accept=".cookup,.json"
            className="hidden"
          />

          <button
            id="random-instrument-btn"
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#18181B] border border-[#28282A] hover:bg-[#232326] text-[#E0E0E0] text-xs font-semibold transition-all hover:border-[#7C5DFF]/50"
            title="Surprise me with a random sound"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#9B82FF]" />
            <span>Random</span>
          </button>
        </div>
      </div>

      {/* Save Modal Dialog */}
      {showSaveDialog && (
        <div className="mb-4 p-3.5 bg-[#18181B] border border-[#7C5DFF]/50 rounded-xl shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-mono text-[#9B82FF] uppercase font-bold block mb-1">
              Save Tweaked Patch to Stash
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="Preset Name (e.g. My Dark Drill 808)"
                className="flex-1 bg-[#0A0A0B] border border-[#28282A] rounded-lg px-3 py-1.5 text-xs text-[#F0F0F0] focus:outline-none focus:border-[#7C5DFF]"
              />
              <input
                type="text"
                value={saveAuthor}
                onChange={(e) => setSaveAuthor(e.target.value)}
                placeholder="Author tag (optional)"
                className="w-32 bg-[#0A0A0B] border border-[#28282A] rounded-lg px-3 py-1.5 text-xs text-[#F0F0F0] focus:outline-none focus:border-[#7C5DFF]"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              onClick={handleSaveCurrentToStash}
              className="px-4 py-1.5 rounded-lg bg-[#7C5DFF] text-[#0A0A0B] font-bold text-xs shadow-lg hover:bg-[#9B82FF] transition-colors"
            >
              Save Patch
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-1.5 rounded-lg bg-[#28282A] text-[#9E9E9E] text-xs hover:text-[#F0F0F0]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category & Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 border-b border-[#28282A] scrollbar-thin">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => {
              if (cat.id === 'custom' && onSelectCustomTab) {
                onSelectCustomTab();
              }
              setSelectedCategory(cat.id);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border flex items-center gap-1.5 ${
              selectedCategory === cat.id
                ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold border-[#7C5DFF] shadow-[0_0_12px_rgba(124,93,255,0.3)]'
                : 'bg-[#18181B] border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#232326]'
            }`}
          >
            <span>{cat.label}</span>
            {cat.badge && (
              <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 rounded font-mono font-bold">
                {cat.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tag Filter Bar */}
      {popularTags.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto text-[10px]">
          <span className="text-[#71717A] flex items-center gap-1 font-mono uppercase">
            <Tag className="w-3 h-3" /> Filter:
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2 py-0.5 rounded transition-colors ${
              activeTag === null
                ? 'bg-[#28282A] text-[#F0F0F0] font-bold'
                : 'text-[#71717A] hover:text-[#9E9E9E]'
            }`}
          >
            All
          </button>
          {popularTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-2 py-0.5 rounded border transition-colors ${
                activeTag === tag
                  ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#C4B5FD] font-bold'
                  : 'bg-[#18181B] border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Instrument Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredInstruments.map((inst) => {
          const isSelected = engine.currentInstrument.id === inst.id;
          const isFav = inst.isFavorite;

          return (
            <div
              key={inst.id}
              id={`instrument-card-${inst.id}`}
              onClick={() => handleSelectInstrument(inst)}
              className={`p-3 rounded-lg border text-left cursor-pointer transition-all relative group flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#7C5DFF]/15 border-[#7C5DFF] ring-1 ring-[#7C5DFF]/50 shadow-[0_0_15px_rgba(124,93,255,0.2)]'
                  : 'bg-[#18181B]/80 border-[#28282A] hover:bg-[#232326] hover:border-[#3A3A3C]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-md ${
                        isSelected
                          ? 'bg-[#7C5DFF] text-[#0A0A0B]'
                          : 'bg-[#121214] text-[#E0E0E0] group-hover:text-[#9B82FF] border border-[#28282A]'
                      }`}
                    >
                      {renderIcon(inst.icon)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-[#F0F0F0] line-clamp-1">
                        {inst.name}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-[#9E9E9E]">
                        <Globe className="w-2.5 h-2.5 text-[#9B82FF]" />
                        <span>{inst.origin}</span>
                        {inst.author && (
                          <span className="font-mono text-[#71717A] text-[9px]">by {inst.author}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete Custom or Star Favorite */}
                  <div className="flex items-center gap-1">
                    {inst.isCustom && (
                      <button
                        onClick={(e) => handleDeleteCustom(e, inst.id)}
                        className="p-1 text-[#71717A] hover:text-red-400 transition-colors"
                        title="Delete custom patch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => handleToggleFavorite(e, inst.id)}
                      className="p-1 text-[#71717A] hover:text-amber-400 transition-colors"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-amber-400 text-amber-400' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#9E9E9E] line-clamp-2 mb-2 leading-relaxed">
                  {inst.description}
                </p>

                {/* Tags */}
                {inst.tags && inst.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {inst.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#0A0A0B] text-[#9B82FF] border border-[#28282A]"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#28282A] text-[10px]">
                <span className="font-mono text-[#9E9E9E] capitalize">
                  {inst.category}
                </span>
                <span
                  className={`font-mono px-1.5 py-0.5 rounded text-[9px] border ${
                    isSelected
                      ? 'bg-[#7C5DFF]/20 text-[#9B82FF] border-[#7C5DFF]/40'
                      : 'bg-[#121214] text-[#9E9E9E] border-[#28282A]'
                  }`}
                >
                  {inst.synthesisType.replace('_', ' ')}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

