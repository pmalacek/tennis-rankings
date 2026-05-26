
import { useEffect, useState } from "react";

export default function Home() {
  const [players, setPlayers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch("/api/rankings")
      .then(res => res.json())
      .then(setPlayers);
  }, []);

  const loadHistory = async (name) => {
    setSelected(name);
    const res = await fetch(`/api/history?name=${name}`);
    const data = await res.json();
    setHistory(data);
  };

  return (
    <div style={{padding:20,fontFamily:"Arial"}}>
      <h1>Top Junior Tennis Players</h1>

      <div style={{display:"flex",gap:20}}>
        <div style={{width:"50%"}}>
          {players.map(p => (
            <div key={p.rank} onClick={()=>loadHistory(p.player_name)} style={{cursor:"pointer",borderBottom:"1px solid #ccc"}}>
              {p.rank} - {p.player_name} ({p.country})
            </div>
          ))}
        </div>

        <div style={{width:"50%"}}>
          {selected && <h3>{selected}</h3>}
          {history.map((h,i)=>(
            <div key={i}>{h.snapshot_date}: Rank {h.rank}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
