import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Terminal, Shield, Search, Code2, Database, Lock, Globe, Mail, Github, Linkedin, ExternalLink, ChevronRight, FileText, Cpu, Network } from "lucide-react";

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*";

const ScrambleText = ({ text, className }: { text: string, className?: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isHovering) {
      let iteration = 0;
      interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((letter, index) => {
              if (index < iteration) {
                return text[index];
              }
              if (letter === " ") return " ";
              return letters[Math.floor(Math.random() * letters.length)];
            })
            .join("")
        );

        if (iteration >= text.length) {
          clearInterval(interval);
        }

        iteration += 1 / 3;
      }, 30);
    } else {
      setDisplayText(text);
    }

    return () => clearInterval(interval);
  }, [isHovering, text]);

  return (
    <span
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={className}
    >
      {displayText}
    </span>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-cyber-bg text-gray-300 relative selection:bg-cyber-green selection:text-black">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none z-0"></div>
      <div className="scanline"></div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-40 bg-cyber-bg/80 backdrop-blur-md border-b border-cyber-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-display font-bold text-xl tracking-tighter flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyber-green" />
            <span className="text-white">SYS<span className="text-cyber-green">.</span>ADMIN</span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-mono text-sm">
            <a href="#about" className="hover:text-cyber-green transition-colors">01. About</a>
            <a href="#skills" className="hover:text-cyber-green transition-colors">02. Skills</a>
            <a href="#projects" className="hover:text-cyber-green transition-colors">03. Projects</a>
            <a href="#research" className="hover:text-cyber-green transition-colors">04. Research</a>
            <a href="#contact" className="px-4 py-2 border border-cyber-green text-cyber-green rounded hover:bg-cyber-green-dim transition-all">Connect</a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">

        {/* Hero Section */}
        <section className="min-h-[80vh] flex flex-col justify-center" id="hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-cyber-green mb-1 flex items-center gap-2">
              <ChevronRight className="w-4 h-4" /> root@localhost:~# whoami
            </p>
            <motion.p
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 1 },
                visible: {
                  opacity: 1,
                  transition: {
                    delayChildren: 1,
                    staggerChildren: 0.06,
                  },
                },
              }}
              className="font-mono text-amber-500 mb-6 ml-6 flex flex-wrap items-center tracking-normal"
            >
              {"sudhanshu shekhar".split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, display: "none" },
                    visible: { opacity: 1, display: "inline" },
                  }}
                  className="uppercase font-bold"
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "steps(2)" }}
                className="inline-block w-2 h-5 bg-cyber-green ml-1"
              />
            </motion.p>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight cursor-default">
              <ScrambleText text="Cybersecurity &" /> <br />
              <ScrambleText
                text="Digital Forensics"
                className="text-transparent bg-clip-text bg-gradient-to-r from-cyber-green to-cyber-blue"
              />
            </h1>
            <h2 className="text-xl md:text-2xl text-gray-400 font-light mb-8 max-w-2xl">
              BCA Student & Security Enthusiast. Specializing in digital investigations, vulnerability analysis, and secure software development.
            </h2>
            <div className="flex flex-wrap gap-4">
              <a href="#projects" className="px-6 py-3 bg-cyber-green text-black font-mono font-medium rounded hover:bg-[#00cc33] transition-colors flex items-center gap-2">
                <Terminal className="w-4 h-4" /> View Projects
              </a>
              <a href="#contact" className="px-6 py-3 border border-cyber-border hover:border-cyber-green font-mono rounded transition-colors flex items-center gap-2">
                <Mail className="w-4 h-4" /> Contact Me
              </a>
            </div>
          </motion.div>
        </section>

        {/* About Section */}
        <section id="about" className="py-24 border-t border-cyber-border border-dashed">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h3 className="font-mono text-cyber-green mb-2">01. About Me</h3>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-6">System Overview</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  Hello! I'm a BCA (Bachelor of Computer Applications) student with a profound passion for understanding how systems work—and more importantly, how they break.
                </p>
                <p>
                  My journey began with web development, but my curiosity quickly led me down the rabbit hole of cybersecurity. Today, my focus lies at the intersection of <span className="text-cyber-green">digital forensic investigation</span>, <span className="text-cyber-blue">security research</span>, and <span className="text-white">secure coding practices</span>.
                </p>
                <p>
                  Whether I'm analyzing memory dumps, participating in CTFs, or building secure web applications, I approach every challenge with an analytical mindset and a commitment to continuous learning.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-lg border border-cyber-border bg-cyber-surface p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyber-green-dim to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="h-full w-full border border-cyber-border/50 rounded flex items-center justify-center relative z-10">
                  <Shield className="w-32 h-32 text-cyber-border group-hover:text-cyber-green transition-colors duration-500" strokeWidth={1} />
                </div>
                {/* Decorative corner accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyber-green"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyber-green"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyber-green"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-green"></div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Skills & Technologies */}
        <section id="skills" className="py-24 border-t border-cyber-border border-dashed">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-cyber-green mb-2">02. Technical Arsenal</h3>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12">Skills & Technologies</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Category 1 */}
              <div className="bg-cyber-surface border border-cyber-border p-6 rounded-lg hover:border-cyber-green transition-colors">
                <div className="mb-4 text-cyber-green"><Shield className="w-8 h-8" /></div>
                <h4 className="font-display font-bold text-white mb-4 text-lg">Cybersecurity</h4>
                <ul className="space-y-2 font-mono text-sm text-gray-400">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-green" /> Network Security</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-green" /> Vulnerability Assessment</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-green" /> Penetration Testing</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-green" /> Cryptography</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-green" /> Malware Analysis</li>
                </ul>
              </div>

              {/* Category 2 */}
              <div className="bg-cyber-surface border border-cyber-border p-6 rounded-lg hover:border-cyber-blue transition-colors">
                <div className="mb-4 text-cyber-blue"><Search className="w-8 h-8" /></div>
                <h4 className="font-display font-bold text-white mb-4 text-lg">Digital Forensics</h4>
                <ul className="space-y-2 font-mono text-sm text-gray-400">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-blue" /> FTK Imager</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-blue" /> Autopsy</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-blue" /> Volatility</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-blue" /> Wireshark</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-cyber-blue" /> Data Recovery</li>
                </ul>
              </div>

              {/* Category 3 */}
              <div className="bg-cyber-surface border border-cyber-border p-6 rounded-lg hover:border-purple-500 transition-colors">
                <div className="mb-4 text-purple-500"><Code2 className="w-8 h-8" /></div>
                <h4 className="font-display font-bold text-white mb-4 text-lg">Programming</h4>
                <ul className="space-y-2 font-mono text-sm text-gray-400">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Java</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Python</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> C / C++</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> Bash Scripting</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-purple-500" /> PowerShell</li>
                </ul>
              </div>

              {/* Category 4 */}
              <div className="bg-cyber-surface border border-cyber-border p-6 rounded-lg hover:border-yellow-500 transition-colors">
                <div className="mb-4 text-yellow-500"><Globe className="w-8 h-8" /></div>
                <h4 className="font-display font-bold text-white mb-4 text-lg">Web Development</h4>
                <ul className="space-y-2 font-mono text-sm text-gray-400">
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-500" /> HTML5 / CSS3</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-500" /> JavaScript (ES6+)</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-500" /> React.js</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-500" /> Node.js</li>
                  <li className="flex items-center gap-2"><ChevronRight className="w-3 h-3 text-yellow-500" /> SQL / NoSQL</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Projects / Lab Work */}
        <section id="projects" className="py-24 border-t border-cyber-border border-dashed">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-cyber-green mb-2">03. Executed Operations</h3>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12">Projects & Lab Work</h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Project 1 */}
              <div className="group relative bg-cyber-surface border border-cyber-border p-8 rounded-lg overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Search className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-mono text-xs text-cyber-blue px-2 py-1 border border-cyber-blue/30 rounded bg-cyber-blue/10">Digital Forensics</div>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><ExternalLink className="w-5 h-5" /></a>
                  </div>
                  <h4 className="font-display text-2xl font-bold text-white mb-3 group-hover:text-cyber-blue transition-colors">Memory Dump Analysis</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Extracted and analyzed volatile memory from a compromised Windows machine using Volatility framework to identify malicious processes and hidden rootkits.
                  </p>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-gray-500">
                    <span>Volatility</span>
                    <span>Windows OS</span>
                    <span>Malware Analysis</span>
                  </div>
                </div>
              </div>

              {/* Project 2 */}
              <div className="group relative bg-cyber-surface border border-cyber-border p-8 rounded-lg overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Lock className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-mono text-xs text-cyber-green px-2 py-1 border border-cyber-green/30 rounded bg-cyber-green/10">Security Experiment</div>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><ExternalLink className="w-5 h-5" /></a>
                  </div>
                  <h4 className="font-display text-2xl font-bold text-white mb-3 group-hover:text-cyber-green transition-colors">Custom Keylogger & Detection</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Developed a proof-of-concept keylogger in Python for educational purposes, followed by creating a script to detect and neutralize similar threats on a local network.
                  </p>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-gray-500">
                    <span>Python</span>
                    <span>Sockets</span>
                    <span>System APIs</span>
                  </div>
                </div>
              </div>

              {/* Project 3 */}
              <div className="group relative bg-cyber-surface border border-cyber-border p-8 rounded-lg overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-mono text-xs text-yellow-500 px-2 py-1 border border-yellow-500/30 rounded bg-yellow-500/10">Web Development</div>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><ExternalLink className="w-5 h-5" /></a>
                  </div>
                  <h4 className="font-display text-2xl font-bold text-white mb-3 group-hover:text-yellow-500 transition-colors">Secure File Vault App</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Built a full-stack web application for securely storing sensitive files. Implemented AES-256 encryption on the client side before uploading to the server.
                  </p>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-gray-500">
                    <span>React</span>
                    <span>Node.js</span>
                    <span>WebCrypto API</span>
                  </div>
                </div>
              </div>

              {/* Project 4 */}
              <div className="group relative bg-cyber-surface border border-cyber-border p-8 rounded-lg overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Network className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="font-mono text-xs text-purple-500 px-2 py-1 border border-purple-500/30 rounded bg-purple-500/10">Network Analysis</div>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><ExternalLink className="w-5 h-5" /></a>
                  </div>
                  <h4 className="font-display text-2xl font-bold text-white mb-3 group-hover:text-purple-500 transition-colors">Packet Sniffer Tool</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    A custom CLI tool written in C to capture and analyze network packets, filtering for specific protocols and identifying potential plaintext credential leaks.
                  </p>
                  <div className="flex flex-wrap gap-3 font-mono text-xs text-gray-500">
                    <span>C</span>
                    <span>libpcap</span>
                    <span>Networking</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Tools I Work With */}
        <section id="tools" className="py-24 border-t border-cyber-border border-dashed">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-cyber-green mb-2">04. Equipment</h3>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12">Tools I Work With</h2>

            <div className="flex flex-wrap gap-4">
              {[
                { name: "FTK Imager", icon: <Search className="w-5 h-5 text-cyber-blue" /> },
                { name: "Autopsy", icon: <Search className="w-5 h-5 text-cyber-blue" /> },
                { name: "Wireshark", icon: <Network className="w-5 h-5 text-purple-500" /> },
                { name: "Nmap", icon: <Network className="w-5 h-5 text-purple-500" /> },
                { name: "Burp Suite", icon: <Shield className="w-5 h-5 text-cyber-green" /> },
                { name: "Metasploit", icon: <Shield className="w-5 h-5 text-cyber-green" /> },
                { name: "Volatility", icon: <Cpu className="w-5 h-5 text-cyber-blue" /> },
                { name: "Git", icon: <Github className="w-5 h-5 text-gray-400" /> },
                { name: "Linux", icon: <Terminal className="w-5 h-5 text-white" /> }
              ].map((tool, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.9, borderRadius: "24px" }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex items-center gap-3 px-6 py-4 bg-cyber-surface border border-cyber-border rounded-lg hover:border-cyber-green hover:shadow-[0_0_15px_rgba(0,255,65,0.2)] transition-colors"
                >
                  {tool.icon}
                  <span className="font-mono text-sm text-gray-300">{tool.name}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Research / Write-ups */}
        <section id="research" className="py-24 border-t border-cyber-border border-dashed">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h3 className="font-mono text-cyber-green mb-2">05. Documentation</h3>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-12">Research & Write-ups</h2>

            <div className="space-y-4">
              {[
                { title: "Understanding NTFS Artifacts for Forensics", date: "Oct 2025", category: "Forensics" },
                { title: "Common Web Vulnerabilities (OWASP Top 10) Explained", date: "Aug 2025", category: "Web Security" },
                { title: "Setting up a Homelab for Malware Analysis", date: "Jun 2025", category: "Lab Setup" }
              ].map((article, i) => (
                <a key={i} href="#" className="block group">
                  <div className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-cyber-surface border border-cyber-border rounded-lg group-hover:border-cyber-green transition-colors">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <FileText className="w-6 h-6 text-gray-500 group-hover:text-cyber-green transition-colors" />
                      <div>
                        <h4 className="font-display font-bold text-white text-lg group-hover:text-cyber-green transition-colors">{article.title}</h4>
                        <span className="font-mono text-xs text-gray-500">{article.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-sm text-gray-400">
                      <span>{article.date}</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-cyber-green" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-32 border-t border-cyber-border border-dashed text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <h3 className="font-mono text-cyber-green mb-2">06. Establish Connection</h3>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Get In Touch</h2>
            <p className="text-gray-400 mb-10 leading-relaxed">
              I'm currently looking for internship opportunities in cybersecurity, digital forensics, or secure web development. Whether you have a question or just want to say hi, my inbox is always open.
            </p>

            <a href="mailto:sanuforwork@gmail.com" className="inline-block px-8 py-4 bg-transparent border border-cyber-green text-cyber-green font-mono rounded hover:bg-cyber-green-dim transition-all mb-16">
              Initialize Handshake
            </a>

            <div className="flex justify-center gap-8">
              <a href="mailto:sanuforwork@gmail.com" className="text-gray-500 hover:text-cyber-green transition-colors">
                <Mail className="w-6 h-6" />
                <span className="sr-only">Email</span>
              </a>
              <a href="https://github.com/Githubxsanu" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">
                <Github className="w-6 h-6" />
                <span className="sr-only">GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/herexsanu/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-cyber-blue transition-colors">
                <Linkedin className="w-6 h-6" />
                <span className="sr-only">LinkedIn</span>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <Globe className="w-6 h-6" />
                <span className="sr-only">Personal Website</span>
              </a>
            </div>
          </motion.div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-border bg-cyber-bg py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-mono text-sm text-gray-500 mb-2">
            Exploring Security, Digital Evidence, and the Architecture of the Web.
          </p>
          <p className="font-mono text-xs text-gray-600">
            designed and built with zeal
          </p>
        </div>
      </footer>
    </div>
  );
}
