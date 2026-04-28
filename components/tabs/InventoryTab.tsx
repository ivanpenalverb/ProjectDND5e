"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useCharacterStore } from '@/store/useCharacterStore';
import { dataService, Equipment } from '@/services/dataService';
import { useDebounce } from 'use-debounce';
import { Search, Loader2, Plus, Minus, Trash2, PackageSearch, Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ExpandableText } from '@/components/ExpandableText';

export const InventoryTab = () => {
  const { characters, activeCharacterId, addEquipment, updateEquipmentQuantity, removeEquipment, updateActiveCharacter } = useCharacterStore();
  const character = characters.find(c => c.id === activeCharacterId);
  
  const [srdEquipment, setSrdEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 300);
  const [showCustomModal, setShowCustomModal] = useState(false);
  
  // Custom Item Form State
  const [customName, setCustomName] = useState('');
  const [customWeight, setCustomWeight] = useState(0);
  const [customQuantity, setCustomQuantity] = useState(1);
  const [customDesc, setCustomDesc] = useState('');
  const [customDamage, setCustomDamage] = useState('');

  const handleAddCustomItem = () => {
    if (!customName) return;
    const item: any = {
      index: `homebrew-${Date.now()}`,
      name: customName,
      weight: customWeight,
      quantity: customQuantity,
      desc: customDesc ? [customDesc] : [],
      equipment_category: { name: 'Homebrew' }
    };
    if (customDamage) {
      item.damage = {
        damage_dice: customDamage,
        damage_type: { name: 'Custom' }
      };
      // So that Actions tab recognizes it
      item.properties = [];
    }
    addEquipment(item);
    setShowCustomModal(false);
    setCustomName('');
    setCustomWeight(0);
    setCustomQuantity(1);
    setCustomDesc('');
    setCustomDamage('');
  };

  const { t, i18n } = useTranslation();

  useEffect(() => {
    setLoading(true);
    dataService.getEquipment(i18n.language).then(data => {
      setSrdEquipment(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [i18n.language]);

  const currency = character?.currency || { cp: 0, sp: 0, gp: 0 };
  const totalCoins = (currency.cp || 0) + (currency.sp || 0) + (currency.gp || 0);
  const coinWeight = totalCoins / 50;

  const totalWeight = useMemo(() => {
    if (!character) return 0;
    const itemsWeight = character.inventory.reduce((acc, item) => acc + ((item.weight || 0) * item.quantity), 0);
    return itemsWeight + coinWeight;
  }, [character?.inventory, coinWeight]);

  const handleUpdateCurrency = (type: keyof typeof currency, value: number) => {
    updateActiveCharacter({ currency: { ...currency, [type]: value } });
  };



  if (!character) return null;

  const filteredEquipment = debouncedSearch.length >= 2 
    ? srdEquipment.filter(e => e.name.toLowerCase().includes(debouncedSearch.toLowerCase())).slice(0, 50)
    : [];

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full h-full">
      {/* Current Inventory Panel */}
      <section className="flex-[3] flex flex-col min-h-0 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80">
        <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-serif text-accent-gold flex items-center gap-2 tracking-wide">
             <PackageSearch size={20} /> Inventory
           </h3>
           <div className="bg-zinc-950 px-4 py-2 rounded-lg border border-zinc-800 flex items-center gap-2 shadow-inner">
             <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Weight:</span>
             <span className={`text-xl font-bold font-serif ${totalWeight > 150 ? 'text-red-500' : 'text-accent-gold'}`}>
               {totalWeight.toFixed(1)} lb
             </span>
           </div>
        </div>

        {/* Currency Row */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 mb-6 bg-zinc-950 p-3 rounded-lg border border-zinc-800 shadow-inner">
          <Coins size={18} className="text-zinc-500 hidden md:block mr-2" />
          
          <div className="flex-1 grid grid-cols-3 gap-4">
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-orange-400 uppercase text-center mb-1">PC</label>
               <input type="number" min={0} value={currency.cp} onChange={e => handleUpdateCurrency('cp', Number(e.target.value) || 0)} className="w-full bg-zinc-900 border border-orange-900/50 text-orange-200 text-center rounded py-1.5 focus:border-orange-500 outline-none appearance-none" />
            </div>
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-zinc-300 uppercase text-center mb-1">PP</label>
               <input type="number" min={0} value={currency.sp} onChange={e => handleUpdateCurrency('sp', Number(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-500/50 text-zinc-200 text-center rounded py-1.5 focus:border-zinc-400 outline-none appearance-none" />
            </div>
            <div className="flex flex-col">
               <label className="text-[10px] font-bold text-yellow-500 uppercase text-center mb-1">PO</label>
               <input type="number" min={0} value={currency.gp} onChange={e => handleUpdateCurrency('gp', Number(e.target.value) || 0)} className="w-full bg-zinc-900 border border-yellow-900/50 text-yellow-200 text-center rounded py-1.5 focus:border-yellow-500 outline-none appearance-none" />
            </div>
          </div>

        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-4">
          {character.inventory.length === 0 ? (
             <p className="text-zinc-500 italic text-center mt-10">Backpack is empty. Scavenge the world.</p>
          ) : (
            character.inventory.map(item => (
              <div key={item.customId} className="flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg p-4 group gap-2">
                 <div className="flex items-center justify-between w-full">
                 <div className="flex flex-col">
                   <span className="text-lg font-bold text-zinc-200">{item.name}</span>
                   <span className="text-xs text-zinc-500">
                     {item.equipment_category?.name} • Weight: {item.weight}lb
                   </span>
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex items-center gap-2 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                     <button onClick={() => updateEquipmentQuantity(item.customId, -1)} className="text-zinc-400 hover:text-red-400 p-1">
                       <Minus size={14} />
                     </button>
                     <span className="w-6 text-center text-sm font-bold text-zinc-300">{item.quantity}</span>
                     <button onClick={() => updateEquipmentQuantity(item.customId, 1)} className="text-zinc-400 hover:text-accent-gold p-1">
                       <Plus size={14} />
                     </button>
                   </div>
                   <button onClick={() => removeEquipment(item.customId)} className="text-zinc-600 hover:text-red-500 p-2">
                     <Trash2 size={18} />
                   </button>
                 </div>
                 </div>
                 {item.desc && item.desc.length > 0 && (
                   <ExpandableText text={item.desc} />
                 )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Equipment Compendium Search */}
      <section className="flex-[2] flex flex-col min-h-0 bg-zinc-900/40 p-6 rounded-xl border border-zinc-800/80">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-serif text-accent-gold tracking-wide">Add Item</h3>
           <button 
             onClick={() => setShowCustomModal(true)}
             className="px-3 py-1.5 bg-blue-900/30 text-blue-400 border border-blue-900/50 rounded-md text-sm font-bold flex items-center gap-1 hover:bg-blue-900/50 transition-colors"
           >
             <Plus size={16} /> Custom Item
           </button>
         </div>

         <div className="relative mb-6">
           <Search size={18} className="absolute left-3 top-3 text-zinc-500" />
           <input 
             type="text"
             placeholder="Search items (e.g. Dagger)..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2.5 pl-10 pr-4 text-zinc-200 focus:outline-none focus:border-accent-gold transition-colors"
           />
           {loading && <Loader2 size={16} className="absolute right-3 top-3 text-accent-gold animate-spin" />}
         </div>

         <div className="flex-1 overflow-y-auto no-scrollbar pr-2 space-y-3">
           {!searchTerm ? (
             <p className="text-zinc-600 text-sm text-center mt-10">Type at least 2 characters to search the armory.</p>
           ) : filteredEquipment.length === 0 && !loading ? (
             <p className="text-zinc-500 text-sm text-center mt-10">Item not found.</p>
           ) : (
             filteredEquipment.map(eq => (
               <div key={eq.index} className="flex justify-between items-center bg-zinc-950 p-3 rounded border border-zinc-800 hover:border-zinc-700">
                 <div>
                   <span className="font-bold text-zinc-300 block">{eq.name}</span>
                   <span className="text-xs text-zinc-500">{eq.weight}lb • {eq.cost?.quantity}{eq.cost?.unit}</span>
                 </div>
                 <button 
                   onClick={() => addEquipment({ ...eq, quantity: 1 })}
                   className="p-2 rounded flex items-center text-xs font-bold transition-all bg-accent-gold/20 text-accent-gold hover:bg-accent-gold/40"
                 >
                   <Plus size={16} /> Add
                 </button>
               </div>
             ))
           )}
         </div>
      </section>

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-xl font-serif text-accent-gold mb-4 border-b border-zinc-800 pb-2">Create Homebrew Item</h3>
             
             <div className="space-y-4">
               <div>
                 <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Name</label>
                 <input type="text" value={customName} onChange={(e) => setCustomName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:border-accent-gold outline-none" placeholder="Sword of Destiny" />
               </div>
               
               <div className="flex gap-4">
                 <div className="flex-1">
                   <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Weight (lb)</label>
                   <input type="number" value={customWeight} onChange={(e) => setCustomWeight(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:border-accent-gold outline-none" />
                 </div>
                 <div className="flex-1">
                   <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Quantity</label>
                   <input type="number" min={1} value={customQuantity} onChange={(e) => setCustomQuantity(Number(e.target.value))} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:border-accent-gold outline-none" />
                 </div>
               </div>

               <div>
                 <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Damage (Optional)</label>
                 <input type="text" value={customDamage} onChange={(e) => setCustomDamage(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 focus:border-red-900/50 outline-none placeholder-zinc-700" placeholder="e.g. 1d6 piercing" />
                 <p className="text-[10px] text-zinc-600 mt-1">If provided, this item will appear in Actions Tab for combat.</p>
               </div>

               <div>
                 <label className="block text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Description</label>
                 <textarea value={customDesc} onChange={(e) => setCustomDesc(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-zinc-200 h-24 resize-none focus:border-accent-gold outline-none" placeholder="A mythical blade that glows in the dark..." />
               </div>
             </div>

             <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCustomModal(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200 font-bold text-sm">Cancel</button>
                <button 
                  onClick={handleAddCustomItem} 
                  disabled={!customName}
                  className="px-4 py-2 bg-accent-gold text-zinc-950 hover:bg-yellow-600 rounded font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Inventory
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
