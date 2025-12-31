import { useEffect, useState } from 'react';
import { Newspaper, ChevronRight } from 'lucide-react';

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    source: string;
}

export const CyberNewsTicker = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                // Using rss2json to fetch The Hacker News standard feed for free/public access
                const res = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.feedburner.com/TheHackersNews');
                const data = await res.json();

                if (data.items) {
                    const mapped = data.items.map((item: any) => ({
                        title: item.title,
                        link: item.link,
                        pubDate: item.pubDate,
                        source: 'The Hacker News'
                    }));
                    setNews(mapped);
                }
            } catch (err) {
                console.error("Failed to load cyber news", err);
                // Fallback news if API fails
                setNews([
                    { title: "Zero-Day Vulnerability Discovered in Core Linux Kernel", link: "#", pubDate: new Date().toString(), source: "System" },
                    { title: "Global Phishing Campaign Targeting Financial Sector", link: "#", pubDate: new Date().toString(), source: "System" },
                    { title: "New Ransomware Variant 'DarkMatter' Emerges", link: "#", pubDate: new Date().toString(), source: "System" }
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        // Refresh every 5 minutes
        const interval = setInterval(fetchNews, 300000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full bg-[#050a14] border-t border-slate-800 py-2 overflow-hidden flex items-center">
            <div className="flex items-center gap-2 px-4 border-r border-slate-800 shrink-0 z-10 bg-[#050a14]">
                <Newspaper className="w-4 h-4 text-neon-cyan animate-pulse" />
                <span className="text-xs font-bold text-neon-cyan uppercase tracking-wider whitespace-nowrap">Global Intel Feed</span>
            </div>

            <div className="flex-1 overflow-hidden relative group">
                {/* Rolling Ticker Animation */}
                <div className="flex animate-marquee hover:[animation-play-state:paused] whitespace-nowrap">
                    {[...news, ...news].map((item, idx) => (
                        <a
                            key={`${idx}-${item.title}`}
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-8 text-xs text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="text-neon-green font-mono">{new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className="font-semibold">{item.source}:</span>
                            <span>{item.title}</span>
                            <ChevronRight className="w-3 h-3 text-slate-600" />
                        </a>
                    ))}
                </div>
            </div>

            {/* Gradient Mask for fading edges */}
            <div className="absolute right-0 w-24 h-8 bg-gradient-to-l from-[#050a14] to-transparent pointer-events-none" />
        </div>
    );
};
