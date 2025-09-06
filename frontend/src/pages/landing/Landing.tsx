import React from 'react'
import Hero from '../components/Hero'
import HomeCategory from '../components/FashionCategory';

const Landing = () => {
  return (
    <main>
      <section>
        <Hero />
      </section>
      <section>
        <HomeCategory/>
      </section>
    </main>
  );
}

export default Landing
