---
title: "Red vs. Blue by SWIFT"
date: 2026-02-28
categories: [Competition]
tags: [cybersecurity, SWIFT, infosec, Blueteam]
image: /assets/img/image5443.png
alt: "Red vs Blue - SWIFT's Cyber Defense Competition at Cal Poly Pomona"
---

## Red vs Blue - SWIFT's Cyber Defense Competition at Cal Poly Pomona
This past weekend, SWIFT hosted a Red vs Blue competition at Cal Poly Pomona, which is very similar to CCDC, with blue teams defending live infrastructure against an active red team, all while maintaining critical services online. It was one of the more intense and educational experiences I have had in a competition environment.

## The Environment
Each team was given five machines to defend, with a mixed operating system environment:

* Windows Server 2022 - Domain Controller and File Server
* Debian 12 - Two Linux machines running scored services
* Hannah Montana Linux - Yes, it is a real Linux distribution, and yes, we have to defend it

---

## What We Were Actually Doing
From the start, the work felt more like a real operational environment than a typical lab. The tasks weren't just theoretical — we were configuring and hardening live systems while a red team was actively trying to take them down.

On the Linux side, we locked down SSH access — restricting unnecessary users, enforcing key-based authentication, and reviewing exposed configurations that could give an attacker an easy foothold. We also handled DNS configuration, making sure the zone was properly set up and resolving correctly, since the Flask application on another machine depended on it functioning reliably.

On the Windows side, we worked through Active Directory configuration in Server Manager — managing users, permissions, and group policies to reduce attack surface. The Domain Controller was also running WordPress on port 80, which meant web hardening was part of the picture as well.

Throughout the competition, the red team was constantly probing, and maintaining service uptime while actively responding to attacks required constant attention. It wasn't enough to configure things once and move on — you had to monitor, adapt, and keep services alive in a dynamic environment.


---

## Business Injects
In addition to the technical work, business injects were provided, which were written tasks to simulate the real world. The tasks included everything from documentation to security memos, and they needed to be completed and submitted via the scoreboard with the technical defense work still ongoing.

## What I Took Away
I think one of the most important things about RvB is something that most CTF challenges don’t offer: the experience of thinking like the defender, but with an actual attacker working against you. There is no scenario, no solution, just services going down and needing to be brought back up.

A few things that I think stick out as something to keep in mind:

Hardening is not something that can be done once and considered complete. The red team will find everything that you didn’t, and they’ll find it very quickly. Going through each of the services methodically and understanding the reasons behind each of the configurations is very important.

DNS and services have more dependency than one would think. When one system is dependent on another, failure can be devastating. Understanding the full architecture of the environment before touching anything is very important.

Windows administration under pressure is an art form in and of itself. 
Active directory, group policies, and service configurations on Server Manager all act very differently when not in a controlled environment where there is time to read the documentation.


---

## Final Thoughts
It was a very well-organized event by SWIFT. The RvB style is one of the best ways to learn hands-on defensive techniques, and competing against a real-time red team is hard to beat for realism. Looking forward to the next one.


---