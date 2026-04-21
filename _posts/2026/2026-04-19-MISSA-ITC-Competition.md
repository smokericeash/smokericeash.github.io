---
title: "MISSA's ITC 2026 Competition"
date: 2026-04-19
categories: [Competition]
tags: [cybersecurity, MISSA, Offensive Security, RedTeam, ITC, Penetration Testing]
image: /assets/img/missa.png
alt: "ITC 2026 from MISSA at Cal Poly Pomona"
---

## ITC 2026 Red Teaming Competition

Over the past two weeks, I had the opportunity to compete in ITC (Information Technology Competition) 2026 in the red teaming track. This experience stood out because it felt much closer to a real client engagement than a typical competition. Instead of working through isolated challenges, my team had to approach the environment like a professional penetration test: understanding scope, identifying attack paths, validating findings, writing a report, and presenting results in a way that would make sense to both technical and executive audiences.

I personally put in more than 20 hours across the engagement period, and it ended up being one of the most valuable offensive security experiences I’ve had so far.

---

## The Environment

The competition was built around a realistic enterprise environment with multiple systems in scope, including:

- Active Directory infrastructure
- Internal web applications
- Kubernetes (container orchestration platform) workloads
- Source control and deployment platforms
- File shares and internal business systems
- Cloud-connected services and storage

Rather than focusing on a single machine or a single exploit, the environment encouraged participants to think about how weaknesses in one system could connect to others.

---

## What We Were Actually Doing

From the start, the work felt less like solving puzzles and more like performing a real assessment. The goal was not just to “get in,” but to understand what was reachable, what was vulnerable, and what the business impact would be if those weaknesses were abused by a real attacker.

A lot of my work centered around repository exposure, hardcoded credentials, Kubernetes secret exposure, and unauthenticated file share access. That meant not only confirming whether something was accessible, but also validating what it exposed and why that mattered.

For example, publicly accessible repositories revealed internal code and infrastructure logic that could be cloned and reviewed offline. That made it possible to identify hardcoded credentials and better understand how internal services were structured. In the Kubernetes portion of the environment, the work involved validating whether a compromised foothold could lead to access to sensitive secret material. In the Windows and file-sharing side of the environment, the focus shifted to whether internal business data was being exposed too broadly and what that would mean from an operational perspective.

The competition also required careful reporting. It was not enough to find an issue — you had to explain how you found it, what it meant, how it could be reproduced, and why it mattered to the client.

---

## Reporting and Presentation

One of the biggest differences between this event and many other cybersecurity competitions was the reporting expectation. The final deliverable was not just a list of technical findings. It had to read like a real consulting report, with technical detail, business impact, remediation guidance, and an executive summary.

That also carried over into the presentation portion. Findings had to be explained in a way that would make sense not only to technical judges, but also to a client audience. That meant translating technical weaknesses into operational, financial, and organizational risk.

In that sense, the event was just as much about communication and professional judgment as it was about exploitation.

![alt text](/assets/img/reportwrite1.png)

---

## What I Took Away

What I appreciated most about ITC 2026 is that it reinforced something important: offensive security is not just about finding vulnerabilities. It is also about validation, discipline, and communication.

A few things stood out to me in particular:

- Working through an environment over a two-week period changes how you think. With more time, you can move beyond first impressions, validate findings more carefully, and better understand how different weaknesses connect.

- Source code and configuration exposure can be just as valuable to an attacker as direct remote access. If someone can read how your systems work, they often do not need to guess nearly as much.

- The difference between a possible issue and a confirmed issue matters a lot. It is easy to overstate something in a competition setting, but strong reporting depends on being precise about what was actually proven.

- Communicating technical risk clearly is a skill in itself. A finding only becomes useful if you can explain what it means to the people responsible for fixing it.

---

## Final Thoughts

Our team finished in the Top 5 among participating schools and teams, including teams from University of California, Irvine (UCI), California State University, Fullerton (CSUF), Cal Poly Pomona’s CPTC (Collegiate Penetration Testing Competition) team, California State University, Northridge (CSUN), and others. I’m proud of that result, but even more than that, I’m grateful for how much I learned from the process.

ITC 2026 was one of the closest experiences I’ve had to a real red team engagement in a competitive setting. It sharpened technical skills, but just as importantly, it strengthened my understanding of validation, reporting, teamwork, and client communication.

Definitely an experience I’ll be building on going forward.