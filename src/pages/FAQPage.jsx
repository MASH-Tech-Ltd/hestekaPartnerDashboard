import React, { useState, useEffect } from "react";
import { useLang } from "../context/LanguageContext";
import { HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import api from "../utils/api";

export default function FAQPage() {
  const { t, lang } = useLang();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState({});

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoading(true);
      try {
        // Fetch all active FAQs
        const res = await api.get(`/faq?limit=100&isActive=true`);
        if (res.data.status === "ok") {
          // Filter to only show active ones just in case
          const activeFaqs = res.data.data.data.filter(f => f.isActive !== false);
          
          // Sort by group order
          activeFaqs.sort((a, b) => (a.order || 0) - (b.order || 0));
          
          // Inside each group, sort Q&A by order
          activeFaqs.forEach(faq => {
            if (faq.contentsArray) {
              faq.contentsArray.sort((a, b) => (a.order || 0) - (b.order || 0));
            }
          });
          
          setFaqs(activeFaqs);
        }
      } catch (err) {
        console.error("Failed to fetch FAQs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  const toggleItem = (groupId, qaIndex) => {
    const key = `${groupId}-${qaIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getCategoryName = (category) => {
    if (!category) return "";
    if (typeof category === 'object') {
      return lang === 'fr' ? (category.french || category.english) : category.english;
    }
    return category;
  };

  const getQaContent = (content) => {
    if (!content || !content.question) return { question: "", answer: "" };
    if (lang === 'fr' && content.question.french && content.question.french.question) {
      return content.question.french;
    }
    return content.question.english || { question: "", answer: "" };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-8 h-8 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
        <p className="text-[#9a8a7a] font-bold text-xs uppercase tracking-widest">{t.loadingLabel || "Loading FAQs..."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div className="bg-white rounded-2xl p-8 border border-[#e8ddd0] shadow-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
          <HelpCircle className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl font-black text-[#3a2a1a] mb-2">{t.faqTitle || "Frequently Asked Questions"}</h1>
        <p className="text-sm text-[#9a8a7a] max-w-lg">
          {t.faqSubtitle || "Find answers to common questions about managing your collection points, local missions, and partner account."}
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {faqs.length > 0 ? (
          faqs.map((group) => (
            <div key={group._id} className="flex flex-col gap-4">
              <h2 className="text-sm font-black text-[#3a2a1a] uppercase tracking-widest flex items-center gap-2 border-b border-[#e8ddd0] pb-2">
                {group.image?.secureUrl && (
                  <img src={group.image.secureUrl} alt="" className="w-6 h-6 rounded object-cover" />
                )}
                {getCategoryName(group.category)}
              </h2>
              
              <div className="flex flex-col gap-3">
                {group.contentsArray?.map((qa, idx) => {
                  const content = getQaContent(qa);
                  const isOpen = openItems[`${group._id}-${idx}`];
                  
                  return (
                    <div 
                      key={idx} 
                      className={`bg-white rounded-xl border transition-all overflow-hidden ${
                        isOpen ? 'border-orange-600 shadow-md' : 'border-[#e8ddd0] hover:border-orange-300'
                      }`}
                    >
                      <button 
                        onClick={() => toggleItem(group._id, idx)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 focus:outline-none"
                      >
                        <span className={`text-sm font-bold transition-colors ${isOpen ? 'text-orange-600' : 'text-[#3a2a1a]'}`}>
                          {content.question}
                        </span>
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-orange-100 text-orange-600' : 'bg-[#fcfaf7] text-[#9a8a7a]'}`}>
                          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </button>
                      
                      <div 
                        className={`px-5 transition-all duration-300 ease-in-out ${isOpen ? 'py-4 border-t border-orange-100 opacity-100 max-h-[1000px]' : 'max-h-0 opacity-0 overflow-hidden py-0 border-t-0'}`}
                      >
                        <p className="text-[13px] leading-relaxed text-[#5a4a3a] whitespace-pre-wrap">
                          {content.answer}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl p-10 border border-[#e8ddd0] flex flex-col items-center justify-center text-center">
            <p className="text-[#9a8a7a] font-bold text-sm">{t.noFaqsFound || "No FAQs found at this time."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
