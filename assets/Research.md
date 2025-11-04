# Research Document : MATH TOOL Analysis Report / Findings 

**Date: ** November 3, 2025

## GOAL
    This document consists of comparing and constrasting several math assistance
    tools that are highly praised by members of similar fields. These findings 
    hope to highlight many of the 'pros and cons' that surround each of the 
    tools, ultimately deciding which - if any - can assist us in our equation 
    extraction methods. 

## LaTeX -> from latex-project.org
    • Strengths applicable to the AI tutor project : 
        - Ensures extremely high levels of display quality on the web
        - Large package system that allows for vast library flexibility / assistance 
    • Weaknesses :
        - Syntax and overall semantics can be loosely defined and not completely standard
        - Macros follow this trend, leading to 'ambiguous instantiations'.
    
        For the Web: 
            - Compatible with KaTex and MathJax (cohesive libraries)


    • Interesting Features / potential functions to implement: 
            SAMPLE Topic -> solution -> list by specific filter
            Collects first, then prints later upon request.s

            \usepackage {xsim} (this package appears to be very commonly used here in all the docs)
            \begin{question}[topics={algebra1}, difficulty=3]
                Solve $x^2-5x+6=0$ -> $ = 'Math Mode'
                    ** This could be a good place for the ChatGPT API call **
                \begin{solution}$x=2,3$\end{solution}
                    - ATTACHES block to a specific ID.
                    - Can be connected to a pre-existing list or can write to a new .xsim file if needed.
                \end{exercise}
                    - attaches to the .xsim database 
                
## OpenMath -> from openMath.org, W3C.com, math.nist.gov, katex.org
    • Overall focus on Content Dictionaries aligned with symbol recognition 

    • Strengths:
        - Very explicit symbol naming / rigit ruleset.
        - Ensures compatibility with ContentMathML
        - ** IMPORTANT ** : Linked-Data can be associated with equation and 
            respective graph.
    • Weaknesses: 
        - Not ideal for display purposes
            - (Would still have to do a lightweight conversion to LaTex or similar)
        - Ownership does not originate from OpenMath which results in heavy outsourcing 


## SymPy -> docs.sympy.org
    • Can use a 'symbolic tree' which can compare equivalent equations
        - T/F boolean structure
    • Uses 'printers' that can support UI functionality
    • Parser can support LaTex.



## Renderers -> docs.mathjax.org, katex.org, progressiveaccess.com

• Main Focus on User Visuals 

# MathJax
    - Can input LaTex, MathML
    - Can output HTML/SVG in the latest v3 version.
        - Supports MathSpeak/ClearSpeak which is important for screen reader 
                accessibility features.
        - IMPORTANT for students who may need audio centered question generation 
                in a future version of the program.

    • Overall:
        - Good for multi-input support, feature rich nature. 
            - **May not be suitable for this project due to a hefty speed tradeoff**

# KaTex
    - Provides mostly the same output across various environments.
    - Excels with more server-side rendering
    - Outputs HTML / MathML and can just be copied and pasted to eliminate the 
        'middle man' for any additional boiler plate code. 


## Overall Analysis for Future Project Usage and/or Sprint 4

    #1 : It appears that KaTex uses a 'renderToString' feature which is good 
        for simple popups and lightweight implementation of HTML copy/paste 
        for testing purposes.
    
    #2 : Use KaTex for some faster display options, but delegate the 'math' 
        of OpenMath into a new and/or separate layer
            -- Allows for viewers to be swapped at any given point

    #3 : For potential accessibility features a teacher or school district would 
        cater to, MathJax (with ClearSpeak v3 as of May 2025) is a good choice
        for toggling this feature in all roles of the project

    #4 : Use a small subset of macros from LaTex, or simply steering away from 
        their implementation all together due to the asynchronous nature of our team.
            - using the 'auto-expand' feature might be better suited towards 
            an in person implementation rather than attempting to explain all the 
            semantics to our sponsor. 
            - Too large of an overhead for the scope of this project

    #5: The cache system of LaTex is interesting for its hashing abilities, 
        since all the problems won't have to be reloaded after every page or screen.
    
    #6: Utilizing a template for question generation from the fixed seed operation 
        found in the LaTex linter.
            - Also can give any devs / team members a live preview of this 

    

        
