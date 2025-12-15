---
title: "SWIFT SCARE CTF COMPETITION"
date: 2025-10-31
categories: [Competition]
tags: [cybersecurity, CTF, OSSCON, offsec]
image: 
alt: "Image alt text"
---

This SCARE Competition was hosted by my club, SWIFT, where we were tasked with attacking 2 Debian machines and a Windows machine. The format was a multi-day red-team style CTF where we were given access to **two Debian machines** and **one Windows host**, each containing a blend of vulnerabilities, misconfigurations, and hidden artifacts.  
The entire event ran for **four days**, and by the end of it, I walked away with a deeper understanding of offensive tooling, system forensics, and real-world attack flow.

---

## My Experience Throughout the Competition

From the very beginning, it was clear this wasn't the usual “solve a puzzle and move on” CTF.  
Instead, the machines felt like actual environments—messy, layered, and unpredictable.

A lot of my early time was spent doing **service enumeration** and **digging through exposed network surfaces**. One of the Debian machines had a vulnerable FTP server that looked harmless, but once I explored it more, I found sensitive files that clearly weren’t meant to be public. That discovery pushed me deeper into the system, eventually guiding me toward privilege-related weaknesses I wouldn't have noticed otherwise.

On the second Debian machine, I spent a good amount of time unraveling **cron jobs** that were intentionally obfuscated. Each layer I removed exposed yet another encoding technique—exactly the kind of challenge that forces you to slow down and understand what the system is actually doing behind the scenes. Working through that chain taught me more about Linux persistence and hidden automation than any textbook explanation ever could.

---

## Digging into Network Traffic & Wireshark Analysis

One of my favorite parts of the competition was the amount of **network forensics** involved.  
We were provided with multiple PCAPs, and I ended up spending hours filtering traffic, carving out sessions, and tracing odd behaviors in Wireshark.  
There were moments where a single packet—or even a strange header—ended up revealing exactly the clue I needed.  

Finding credentials inside malformed HTTP traffic or spotting encoded data transfers across seemingly normal sessions was incredibly satisfying.  
It made the environment feel alive, like I was catching glimpses of attacker activity in motion.

---

## Cracking the Windows Host

The Windows machine pushed me into territory I don’t always get to practice.  
Mismanaged NTLM authentication provided an unexpected foothold, and once I figured out how to leverage that, I was able to access files meant only for Administrators.  
It felt like unlocking a door I wasn’t supposed to see behind—except this time it was all within an approved CTF environment.

Following the breadcrumbs through Windows shares, user directories, and permission structures helped me appreciate how a single weak link in authentication can spiral into full compromise.

---

## Steganography & Hidden Clues

A recurring theme throughout the competition was how often important data was **hidden in plain sight**.  
Several images and files contained buried content—sometimes encoded, sometimes embedded, sometimes disguised through layers of compression.  

I had to use a mix of steganography tools, manual hex inspection, and pattern recognition to extract what I needed.  
Each solved steg challenge felt like peeling back another layer of the story.

---

## Looking Back

Across all four days, the SCARE CTF pushed me through a full range of cybersecurity fundamentals:

- Linux enumeration and system analysis  
- Windows authentication weaknesses  
- Packet-level forensics  
- Steganography and data extraction  
- Realistic exploitation chains instead of isolated one-offs  

By the time I finished, it felt less like a competition and more like a condensed red-team training scenario. I had placed 4th, but the experiences were more exciting than the striving for placement.

And honestly—  
**I learned a ton.**  

From digging through FTP directories to cracking obfuscated scripts, from intercepting leaked data in network captures to navigating NTLM quirks, the whole experience reinforced the importance of curiosity, persistence, and creativity in offensive security.

I’m already looking forward to the next SWIFT CTF.

---