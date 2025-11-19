import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from 'recharts';
import { RetroWindow, RetroBox } from '@/components/retro-ui';
import { Award, TrendingUp, Activity } from 'lucide-react';
import { ClothingItem, Outfit } from '@/types/retro';

interface StatsPageProps {
  items: ClothingItem[];
  history: Outfit[];
}

const COLORS = ['#FF99C8', '#A0C4FF', '#CAFFBF', '#FDFFB6', '#FF8E72', '#A0C4FF', '#FF99C8'];

export const StatsPage: React.FC<StatsPageProps> = ({ items, history }) => {
  
  // Calculate Analytics on the fly (simulating wardrobe_analytics view)
  const analytics = useMemo(() => {
      const totalItems = items.length;
      const favoriteCount = items.filter(i => i.is_favorite).length;
      const totalWearCount = items.reduce((sum, i) => sum + i.wear_count, 0);
      const avgWearCount = totalItems > 0 ? (totalWearCount / totalItems).toFixed(1) : 0;
      const maxWearItem = [...items].sort((a,b) => b.wear_count - a.wear_count)[0];
      
      // Logic for "Rarely Worn": wear_count < 2 OR not worn in 90 days (mocked by simple wear count here)
      const rarelyWornCount = items.filter(i => i.wear_count < 2).length;

      // Category breakdown for chart
      const catCounts: Record<string, number> = {};
      items.forEach(i => {
          catCounts[i.category] = (catCounts[i.category] || 0) + 1;
      });
      const chartData = Object.keys(catCounts).map(k => ({ name: k, count: catCounts[k] }));

      return {
          totalItems,
          favoriteCount,
          avgWearCount,
          maxWearItem,
          rarelyWornCount,
          chartData
      };
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <RetroWindow title="WARDROBE_ANALYTICS.VIEW" className="min-h-[300px]">
        <div className="p-4 flex flex-col gap-2 h-full">
             <h3 className="font-mono font-bold uppercase border-b-2 border-black pb-1">Inventory Distribution</h3>
             <div className="h-64 w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.chartData}>
                    <XAxis 
                        dataKey="name" 
                        tick={{fill: '#000000', fontFamily: 'monospace', fontSize: 10, fontWeight: 'bold'}} 
                        axisLine={{stroke: 'black', strokeWidth: 2}}
                        tickLine={false}
                        dy={10}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: '#FFFFFF', 
                            border: '2px solid black', 
                            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                            fontFamily: 'monospace'
                        }} 
                        cursor={{fill: 'rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                        {analytics.chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="black" strokeWidth={2} />
                        ))}
                    </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </RetroWindow>

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
            <RetroBox color="bg-[#CAFFBF]" className="flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <Activity size={24} />
                    <span className="font-mono text-xs font-bold">AVG WEAR</span>
                </div>
                <p className="font-black text-4xl mt-2">{analytics.avgWearCount}</p>
                <p className="text-[10px] font-mono">Per Item</p>
            </RetroBox>
            
            <RetroBox color="bg-[#FF8E72]" className="flex flex-col justify-between">
                <div className="flex justify-between items-start">
                    <TrendingUp size={24} />
                    <span className="font-mono text-xs font-bold">RARELY WORN</span>
                </div>
                <p className="font-black text-4xl mt-2">{analytics.rarelyWornCount}</p>
                <p className="text-[10px] font-mono">Items to purge?</p>
            </RetroBox>
        </div>

        <RetroWindow title="MOST_VALUABLE_ITEM.EXE" className="flex-1">
            {analytics.maxWearItem ? (
                <div className="p-4 flex gap-4 items-center h-full">
                    <div className="w-24 h-24 border-2 border-black overflow-hidden bg-gray-100">
                        <img src={analytics.maxWearItem.image_url} alt={analytics.maxWearItem.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Award size={20} className="text-[#FFD700]" />
                            <span className="font-black text-lg">MVP</span>
                        </div>
                        <h4 className="font-bold">{analytics.maxWearItem.name}</h4>
                        <p className="font-mono text-xs text-gray-600">Worn {analytics.maxWearItem.wear_count} times</p>
                    </div>
                </div>
            ) : (
                <div className="p-4 flex items-center justify-center h-full font-mono text-gray-400">
                    NO DATA AVAILABLE
                </div>
            )}
        </RetroWindow>
      </div>
    </div>
  );
};
