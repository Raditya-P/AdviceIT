# Study protocol

**Explanations and appropriate reliance on AI investment advice: an online experiment**

Draft for the research ethics committee, version 3.0.0 of the AdviceIT instrument, design
`content5-ml-misread8`. Square brackets mark what is still to be decided or filled in. The committee's
own form takes precedence; the sections below are written so they can be copied into it.

## 1. Investigators

| Role | Name | Affiliation | Contact |
| --- | --- | --- | --- |
| Principal researcher | Raditya Pratama | Department of Information Systems, Institut Teknologi Sepuluh Nopember (ITS), Surabaya | radityapratama2077@gmail.com |
| Supervising lecturer | [Name] | Department of Information Systems, ITS | [email] |
| Team member: infrastructure | Fausta Irsyad Ramadhan | [affiliation] | [email] |
| Team member: research validation | Muhammad Wahyudi Wicaksono | [affiliation] | [email] |

## 2. Background

Investment apps increasingly recommend what people should do with their money, and the recommendation
comes from a model. When the model is right, following it helps; when it is wrong, following it costs
money. Explanations are meant to help people tell the two apart, but earlier work found that
explanations can also make people accept advice whether or not it is correct (Bansal et al., CHI 2021;
Buçinca, Malaya and Gajos, CSCW 2021). This study asks which kinds of explanation help lay investors
rely on automated investment advice appropriately: follow it when it is sound and set it aside when it
is not (Schemmer et al., IUI 2023). It follows a systematic literature review by the same team on trust
and algorithm aversion in the choice between human and AI financial advisors.

## 3. Aims and research questions

The study tests whether the content of an explanation changes how well people distinguish sound from
flawed investment advice given by an AI advisor.

1. Does the kind of explanation shown with AI investment advice change the difference between
   reliance on sound advice and reliance on flawed advice?
2. Do explanations that show the facts the advisor used help people notice advice built on a wrong
   fact, compared with no explanation?
3. Does showing the advisor's confidence help, given that a wrong fact leaves the advisor just as
   confident?

## 4. Design

An online experiment with one between-participants factor, the explanation condition, with five levels:
no explanation (control); why (how much each fact counted); what would change it (the smallest change
that gives different advice); how sure (the advisor's calibrated probability for each outcome); and all
three together. Each participant is placed in one condition at consent, the one with the fewest
participants so far (balanced assignment).

Within participants, each person judges eight short cases about made-up investors, in an order seeded
by their participant ID. Four of the eight, drawn at random, come with flawed advice: the advisor is
given one or two wrong facts about the person (for example a low attitude to risk where the story says
medium), so its advice does not suit them. The explanations stay truthful about what the advisor did,
including the wrong fact. The advisor is a neural network trained on ILS-Bench, 400 synthetic investor
cases labelled by a panel of four financial experts (Bonelli, Mendeley Data, CC BY 4.0). It runs in the
participant's browser.

## 5. Participants

- **Who:** adults aged 18 or older who can read Bahasa Indonesia or English. No other inclusion or
  exclusion criteria; the study is about lay investors, so no financial background is required.
- **How many:** [N per condition, five conditions, N total], planned by simulation
  (`scripts/power-sim.ts`) from the pilot's figures. Under cautious assumptions the simulation gives
  about 80 per condition (400 in total) if the explanations lower reliance on flawed advice by 20
  percentage points, and about 140 per condition (700) if by 15.
- **Recruitment:** an open link (https://www.advice-it.online/participate) shared through university
  mailing lists, student and alumni groups, and social media, with the recruitment message in
  `consent-and-debrief.md`. [Recruitment platform, if any.]
- **Vulnerable groups:** none targeted. Minors are excluded by the age statement in the consent.

## 6. Procedure

All on the participant's own device, in one sitting of about 15 to 20 minutes.

1. **Information and consent** (`/study`, first screen): what the study involves, that nothing is real
   financial advice, that some details are explained at the end, who can take part, how data are
   stored, used and deleted, and contacts. The participant ticks a box stating they are 18 or older,
   have read the information and agree to take part. Nothing is stored before this.
2. **Three financial literacy questions** (the "Big Three", Lusardi and Mitchell).
3. **Statements about how they think:** need for cognition (six items), expectations of the advice
   (three items), and one attention statement.
4. **Eight cases.** For each: read the story; press a button to see the advisor's recommendation (and,
   except in the control, the explanation); choose to follow, adjust, reject or ask a human adviser;
   rate trust, understanding, confidence in the decision and mental demand on 1 to 7 scales; optionally
   write a reason.
5. **Closing questions:** five ratings of the explanations (not shown in the control), one attention
   statement, and two optional open questions about distrust and missing explanations.
6. **Debrief:** which cases had deliberately flawed advice and what wrong fact the advisor was given,
   why this was done, a reminder to check real advice against one's own situation, and the offer to
   delete their answers (section 7).
7. **Completion:** a completion code and the participant ID, needed for a deletion request.

A participant can stop at any time by closing the page. Progress is kept in their own browser for up to
seven days so they can resume, and is erased from the browser when they finish.

## 7. Deception and debriefing

The study uses incomplete disclosure: participants are not told in advance that some advice is
deliberately flawed. Telling them would change the behaviour the study measures, since people who
expect wrong advice scrutinise every recommendation in a way they would not with a real advisor. The
consent says that some details of the study are explained at the end.

The deception is mild and short-lived. The advice concerns made-up people, no real money or real
decision is involved, and every participant who finishes is told, case by case, which advice was wrong
and why. The debrief also explains that real automated advisors can make the same kind of mistake, which
gives participants something useful to take away. Participants who would rather their answers were not
used, now that they know, can have them deleted by sending their participant ID; the debrief says so.

Participants who stop before the end do not see the debrief. Their answers are kept under the same
rules, and the deletion route in the consent applies to them too.

## 8. Risks and benefits

**Risks** are minimal. Participants judge investment advice for fictional people; no personal financial
information is asked for. A participant could take the advice as if it were meant for them; the
consent, the case wording ("you are 34...", about a made-up person) and the debrief all state that
nothing is real financial advice. Some participants may feel uneasy at having followed wrong advice;
the debrief frames this as the purpose of the study and as a common, reasonable reaction.

**Benefits** to participants are small: the debrief shows a realistic way automated advice goes wrong
and suggests checking advice against one's own situation. The expected benefit to society is evidence
on which explanations help people rely on AI financial advice appropriately.

## 9. Consent

Consent is given online, by ticking the checkbox described in section 6, after reading the information.
The full texts in English and Bahasa Indonesia are in `consent-and-debrief.md`. The participant can read
the privacy page at any time (https://www.advice-it.online/privacy).

## 10. Data management

- **Collected:** answers to the questions above, the cases and advice shown, decisions, ratings,
  optional written answers, timings, the site language and version, whether the device is a phone, and
  whether the session was paused and resumed.
- **Not collected:** name, email, account, IP-based profile, location, or any tracking or advertising
  identifiers. Written answers are free text; participants are not asked for anything identifying, and
  any identifying detail found during analysis is removed.
- **Identifier:** a random participant ID generated in the browser (for example P-7KQ2MX), shown to the
  participant at the end.
- **Storage:** a PostgreSQL database (Neon) in the AWS Asia Pacific (Singapore) region, reached
  through the site's server functions, also in Singapore (Vercel). Only the research team can read the
  data, through a key-protected endpoint.
- **Retention:** [for example five years after the last publication], then deleted.
- **Sharing:** after publication, the anonymous dataset may be deposited in a public research data
  archive (for example OSF), as the consent states.
- **Deletion:** on request with the participant ID, until the data are published.
- **In the browser:** the unfinished session (seven days at most) and answers that could not be sent
  while offline, both removed once sent or finished.

## 11. Compensation

[None / a prize draw among completed sessions / a fixed e-wallet credit per completed session.] If
there is compensation, the completion code is used to claim it, and the consent and recruitment message
must say how.

## 12. Timeline

| Phase | When |
| --- | --- |
| Pilot (trial run, not reported as results) | [now until approval] |
| Expert review of the cases, back-translation, think-aloud sessions | [ ] |
| Ethics approval | [ ] |
| Pre-registration on OSF | before the main study starts |
| Main data collection | [ ], until the planned sample size is reached |
| Analysis and writing | [ ] |

## 13. Attachments

- Consent, debrief and recruitment texts in both languages (`consent-and-debrief.md`).
- The questionnaire items in both languages (`translation.md`).
- Screenshots of each screen of the study in both languages [to be added].
- The design summary (https://www.advice-it.online/design) and the pre-registration draft
  (`preregistration.md`).
