import React, { useState, useEffect, useRef } from 'react';
import './LandingPageWireframe.sass';
import { HeroSection, LogosSection, ContactSection, FooterSection, ImageTextSection } from './LandingPageSections';
import { useLandingPage } from './LandingPageContext';

interface WireframeSection {
  id: string;
  type: 'hero' | 'logos' | 'contact' | 'footer' | 'image-text';
  title: string;
}

const LandingPageWireframe: React.FC = () => {
  const { setEditMode } = useLandingPage();
  
  const [sections, setSections] = useState<WireframeSection[]>([
    { id: '1', type: 'hero', title: 'Hero Section' },
    { id: '2', type: 'logos', title: 'Organization Logos' },
    { id: '3', type: 'contact', title: 'Contact Information' },
    { id: '4', type: 'footer', title: 'Footer' },
  ]);
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showAddMenu, setShowAddMenu] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scalerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current && scalerRef.current) {
        const wrapperWidth = wrapperRef.current.offsetWidth;
        const scalerWidth = 1920;
        const newScale = Math.min(1, wrapperWidth / scalerWidth);
        setScale(newScale);
      }
    };
    
    updateScale();
    window.addEventListener('resize', updateScale);
    
    // Use ResizeObserver to detect when side panel changes
    const resizeObserver = new ResizeObserver(updateScale);
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }
    
    return () => {
      window.removeEventListener('resize', updateScale);
      resizeObserver.disconnect();
    };
  }, []);

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter(section => section.id !== id));
  };
  
  const handleEditSection = (id: string) => {
    const section = sections.find(s => s.id === id);
    if (!section) return;
    
    setEditingSection(editingSection === id ? null : id);
    
    // Set edit mode based on section type
    switch (section.type) {
      case 'hero':
        setEditMode({ type: 'hero', sectionId: id });
        break;
      case 'logos':
        setEditMode({ type: 'logos', sectionId: id });
        break;
      case 'image-text':
        setEditMode({ type: 'image-text', sectionId: id });
        break;
      case 'contact':
        setEditMode({ type: 'contact', sectionId: id });
        break;
      case 'footer':
        setEditMode({ type: 'footer', sectionId: id });
        break;
    }
  };

  const handleAddSection = (type: WireframeSection['type'], afterId: string) => {
    const newSection: WireframeSection = {
      id: Date.now().toString(),
      type,
      title: getSectionTitle(type),
    };
    
    const index = sections.findIndex(s => s.id === afterId);
    const newSections = [...sections];
    newSections.splice(index + 1, 0, newSection);
    setSections(newSections);
    setShowAddMenu(null);
  };
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newSections = [...sections];
    const draggedSection = newSections[draggedIndex];
    newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);
    
    setSections(newSections);
    setDraggedIndex(index);
  };
  
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const getSectionTitle = (type: WireframeSection['type']) => {
    switch (type) {
      case 'hero': return 'Hero Section';
      case 'logos': return 'Organization Logos';
      case 'image-text': return 'Image & Text';
      case 'contact': return 'Form';
      case 'footer': return 'Footer';
    }
  };

  const renderSection = (section: WireframeSection, index: number) => {
    const sectionProps = { id: section.id, onRemove: handleRemoveSection };
    
    let SectionComponent;
    switch (section.type) {
      case 'hero':
        SectionComponent = HeroSection;
        break;
      case 'logos':
        SectionComponent = LogosSection;
        break;
      case 'contact':
        SectionComponent = ContactSection;
        break;
      case 'footer':
        SectionComponent = FooterSection;
        break;
      case 'image-text':
        SectionComponent = ImageTextSection;
        break;
      default:
        return null;
    }
    
    return (
      <div 
        key={section.id}
        className={`landing-page-wireframe__section-wrapper ${draggedIndex === index ? 'landing-page-wireframe__section-wrapper--dragging' : ''}`}
        draggable
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDragEnd={handleDragEnd}
      >
        <div className="landing-page-wireframe__controls">
          <button 
            className="landing-page-wireframe__control-btn landing-page-wireframe__control-btn--add"
            onClick={() => setShowAddMenu(showAddMenu === section.id ? null : section.id)}
            aria-label="Add section"
            title="Add section below"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button 
            className="landing-page-wireframe__control-btn landing-page-wireframe__control-btn--edit"
            onClick={() => handleEditSection(section.id)}
            aria-label="Edit section"
            title="Edit section"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11.5 2.5l2 2L6 12l-3 1 1-3 7.5-7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          
          <button 
            className="landing-page-wireframe__control-btn landing-page-wireframe__control-btn--move"
            aria-label="Drag to reorder"
            title="Drag to reorder"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 6h10M3 10h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="5" cy="6" r="1" fill="currentColor"/>
              <circle cx="11" cy="6" r="1" fill="currentColor"/>
              <circle cx="5" cy="10" r="1" fill="currentColor"/>
              <circle cx="11" cy="10" r="1" fill="currentColor"/>
            </svg>
          </button>
          
          {section.type !== 'footer' && (
          <button 
              className="landing-page-wireframe__control-btn landing-page-wireframe__control-btn--delete"
              onClick={() => handleRemoveSection(section.id)}
              aria-label="Remove section"
              title="Remove section"
            >
              ✕
            </button>
          )}
        </div>
        
        {showAddMenu === section.id && (
          <div className="landing-page-wireframe__add-menu">
            <button onClick={() => handleAddSection('hero', section.id)}>+ Hero</button>
            <button onClick={() => handleAddSection('logos', section.id)}>+ Logos</button>
            <button onClick={() => handleAddSection('image-text', section.id)}>+ Image Text</button>
            <button onClick={() => handleAddSection('contact', section.id)}>+ Contact</button>
          </div>
        )}
        
        <SectionComponent {...sectionProps} />
      </div>
    );
  };

  return (
    <div className="landing-page-wireframe" ref={wrapperRef}>
      <div 
        className="landing-page-wireframe__scale-wrapper"
        style={{ 
          width: `${1920 * scale}px`,
          height: scalerRef.current ? `${scalerRef.current.offsetHeight * scale}px` : 'auto'
        }}
      >
        <div 
          className="landing-page-wireframe__scaler" 
          ref={scalerRef}
          style={{ transform: `scale(${scale})` }}
        >
          <div className="landing-page-wireframe__container">
            {sections.map((section, index) => renderSection(section, index))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageWireframe;

