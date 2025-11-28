import React from 'react'
import Hero from '../components/Hero'
import HomeCategory from '../components/FashionCategory';

const Landing = () => {
  return (
    <main className='mt-7'>
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
