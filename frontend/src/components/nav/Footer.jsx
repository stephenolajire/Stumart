import React, {useEffect} from 'react';
import { Link } from 'react-router-dom';
import AOS from "aos";
import "aos/dist/aos.css";

const Footer = () => {

  useEffect(() => {
      AOS.init({
        duration: 1000,
        once: true,
        easing: "ease-in-out",
        offset: 100,
      });
    }, []);

  return (
    <footer className='hide-scrollbar'>
      <section className="py-16 bg-gray-900">
        <div className="w-full mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2" data-aos="fade-right">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">StuMart</h3>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Connecting campus communities through innovative commerce
                solutions. Making student life easier, one delivery at a time.
              </p>
              <div className="flex space-x-4">
                {[
                  "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z",
                  "M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z",
                  "M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z",
                  "M12.5.75C6.146.75 1 5.896 1 12.25c0 5.089 3.292 9.387 7.863 10.91-.145-.971-.275-2.461.058-3.509.301-.953 1.947-8.26 1.947-8.26s-.479-.958-.479-2.374c0-2.224 1.289-3.884 2.895-3.884 1.364 0 2.022 1.024 2.022 2.253 0 1.372-.87 3.422-1.321 5.33-.375 1.587.797 2.884 2.364 2.884 2.84 0 5.021-2.993 5.021-7.318 0-3.815-2.74-6.491-6.677-6.491-4.55 0-7.253 3.417-7.253 6.932 0 1.375.526 2.854 1.186 3.654.13.161.149.302.111.467-.121.508-.394 1.61-.446 1.837-.068.296-.222.357-.512.215-1.904-.886-3.097-3.656-3.097-5.888 0-4.785 3.484-9.181 10.063-9.181 5.28 0 9.38 3.756 9.38 8.777 0 5.24-3.304 9.464-7.9 9.464-1.544 0-2.99-.803-3.484-1.76 0 0-.762 2.9-.947 3.618-.344 1.323-1.274 2.98-1.896 3.99C10.068 23.935 11.263 24.25 12.5 24.25c6.355 0 11.5-5.146 11.5-11.5S18.855.75 12.5.75z",
                ].map((path, index) => (
                  <div
                    key={index}
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
                    data-aos="zoom-in"
                    data-aos-delay={index * 100}
                  >
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={path} />
                    </svg>
                  </div>
                ))}
              </div>
            </div>

            <div data-aos="fade-up" data-aos-delay="200">
              <h4 className="text-lg font-bold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                {["Home", "Products", "Become a Vendor", "Join as Picker"].map(
                  (link, index) => (
                    <Link
                      key={index}
                      to="#"
                      className="block text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  )
                )}
              </div>
            </div>

            <div data-aos="fade-up" data-aos-delay="400">
              <h4 className="text-lg font-bold text-white mb-4">Support</h4>
              <div className="space-y-2">
                {["Help Center", "Contact Us", "FAQs", "Privacy Policy"].map(
                  (link, index) => (
                    <Link
                      key={index}
                      to=""
                      className="block text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </Link>
                  )
                )}
              </div>
            </div>
          </div>

          <div
            className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center"
            data-aos="fade-up"
          >
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 StuMart. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(
                (link, index) => (
                  <Link
                    key={index}
                    to="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
};

export default Footer;