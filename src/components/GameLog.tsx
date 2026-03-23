interface GameLogProps {
  log: string[];
}

export default function GameLog({ log }: GameLogProps) {
  return (
    <div className="h-32 md:h-40 w-full shrink-0 border-t-2 md:border-t-2 border-t-0 border-white p-4 bg-black/80 overflow-y-auto text-[10px] space-y-1">
      {log.map((m, i) => (
        <div key={i} className={i === 0 ? 'text-white' : 'opacity-40'}>
          {`> ${m}`}
        </div>
      ))}
    </div>
  );
}
