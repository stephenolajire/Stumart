import React from "react";
import Hero from "../components/Hero";
import HomeCategory from "../components/FashionCategory";
import FeaturedShops from "../components/FeaturedShops";

const Landing = () => {
  return (
    <main className="mt-7 overflow-x-hidden w-screen lg:w-[calc(100vw-272px)]">
      <section>
        <Hero />
      </section>
      <section>
        <FeaturedShops />
      </section>
    </main>
  );
};

export default Landing;
