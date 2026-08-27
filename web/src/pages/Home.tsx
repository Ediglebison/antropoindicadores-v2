import { Link } from 'react-router-dom';
import { Leaf, ClipboardList, BarChart3, Landmark, ArrowRight } from 'lucide-react';
import logoImg from '../assets/ppgeaa_ia.png';
import './Home/styles.css';

export default function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__content">
          <span className="home-hero__badge">
            <Leaf size={16} />
            Amazônia · UFPA Castanhal
          </span>
          <h1 className="home-hero__title">Antropoindicadores</h1>
          <p className="home-hero__subtitle">
            Programa de Pós-Graduação em Estudos Antrópicos na Amazônia (PPGEAA)
          </p>
          <p className="home-hero__institution">
            Universidade Federal do Pará — Campus Castanhal
          </p>
          <p className="home-hero__lead">
            Coletamos, sistematizamos e analisamos dados socioambientais e
            antrópicos na Amazônia para construir uma base de indicadores que
            ajuda a compreender dinâmicas territoriais, impactos ambientais e a
            apoiar políticas públicas de sustentabilidade e bem-estar das
            populações locais.
          </p>
          <Link to="/login" className="home-cta">
            Acessar o Sistema
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="home-hero__visual">
          <img src={logoImg} alt="Logo Antropoindicadores PPGEAA" className="home-hero__logo" />
        </div>
      </section>

      <section className="home-mission">
        <h2 className="home-section-title">Sobre o Projeto</h2>
        <p className="home-mission__text">
          O Antropoindicadores reúne pesquisadores, equipes de campo e gestores
          em torno de uma mesma missão: transformar a realidade das populações
          amazônicas em evidências claras e acessíveis. Cada coleta em campo
          alimenta indicadores que revelam como territórios vivem, se adaptam e
          resistem — subsidando decisões mais justas e sustentáveis.
        </p>
      </section>

      <section className="home-highlights">
        <h2 className="home-section-title">O que fazemos</h2>
        <div className="home-cards">
          <article className="home-card home-card--green">
            <div className="home-card__icon">
              <ClipboardList size={24} />
            </div>
            <h3 className="home-card__title">Coleta em campo</h3>
            <p className="home-card__text">
              Registro estruturado de dados socioambientais diretamente nas
              comunidades, mesmo em locais remotos e offline.
            </p>
          </article>

          <article className="home-card home-card--blue">
            <div className="home-card__icon">
              <BarChart3 size={24} />
            </div>
            <h3 className="home-card__title">Indicadores socioambientais</h3>
            <p className="home-card__text">
              Sistematização das informações em indicadores que revelam dinâmicas
              territoriais e impactos ambientais.
            </p>
          </article>

          <article className="home-card home-card--green">
            <div className="home-card__icon">
              <Landmark size={24} />
            </div>
            <h3 className="home-card__title">Apoio à política pública</h3>
            <p className="home-card__text">
              Evidências para fundamentar políticas de sustentabilidade e
              bem-estar das populações locais.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
