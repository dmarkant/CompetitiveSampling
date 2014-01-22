#####
# Simulating all possible gambles in competitive sampling paradigm
##
## STEP 1 - SIMULATE OUTCOMES OF AGENTS WITH PRE-DEFINED SAMPLE SIZES FOR COMPETITIVE URN SAMPLING GAME
## Paradigm: 2 players , two options (boxes).
##


# Read in tanny's custom r fuctions as always
# source(file = "/Users/phillips/Dropbox/Tannys R Code/Tannys custom r functions.R") ## Read in Tanny's functions as always

###
## Custom functions for compeitive sampling task

# [CS.Ind.fun] - Given parameters of gambles H and L and total Sample size, returns a df indicating the probability of WANTING H and L.
# [CS.Comp.fun] - Given H.pars, L.pars, Agent.Samples , Comp.Samples , returns several outcome probabilities 


  
  ## [CS.Ind.fun] - "Competitive Sampling Individual function"
  ## Given parameters of gambles H and L and total Sample size, returns a df indicating the probability of WANTING H and L.
  ## Assumes that the agent wants the option with the higher sample mean. If it only has samples from a single option, it wants it if the 
  ## sample mean is positive, and wants the other if the sample mean is negative.
  
  
  A.pars <- Gamble.H.pars
  B.pars <- Gamble.L.pars
  Samples <- PA.Samples
  
  
  CS.Ind.fun <- function(
    A.pars = matrix(c(30, .2, -10), nrow = 1, ncol = 3), 
    B.pars = matrix(c(20, .8, -20), nrow = 1, ncol = 3), 
    Samples = 8
  ) 
    
  {
    
    
    # A.pars <- matrix(c(30, 40, 10, .3, .5, .7, -10, -30, -20), nrow = 3, ncol = 3)
    # B.pars <- matrix(c(10, 90, 20, .1, .9, .2, -5, -70, -80), nrow = 3, ncol = 3)
    # Samples <- c(4, 9, 10)
    
    
    N.Gambles <- nrow(A.pars)
    
    A.Mu <- A.pars[, 1] * A.pars[, 2] + A.pars[, 3] * (1 - A.pars[, 2])  # Mean of A
    B.Mu <- B.pars[, 1] * B.pars[, 2] + B.pars[, 3] * (1 - B.pars[, 2])  # Mean of B
    
    HEV.Option <- rep(-99, N.Gambles)
    HEV.Option[A.Mu > B.Mu] <- "A"
    HEV.Option[B.Mu > A.Mu] <- "B"
    
    H.pars <- matrix(NA, nrow = nrow(A.pars), ncol = ncol(A.pars))
    H.pars[HEV.Option == "A", ] <- A.pars[HEV.Option == "A", ] 
    H.pars[HEV.Option == "B", ] <- B.pars[HEV.Option == "B", ] 
    
    L.pars <- matrix(NA, nrow = nrow(A.pars), ncol = ncol(A.pars))
    L.pars[HEV.Option == "A", ] <- B.pars[HEV.Option == "A", ]
    L.pars[HEV.Option == "B", ] <- A.pars[HEV.Option == "B", ] 
    
    
    Compare.Joint.Distribution <- function(H.Samples.i, H.pars.i, L.Samples.i, L.pars.i) {
      
      # H.Samples.i - number of times high option sampled
      # H.pars.i - observed value of high option
      # L.Samples.i - number of times low option sampled
      # L.pars.i - observed value of low option

      if(H.Samples.i > 0) {
        
        # 
        H.Means <- ((0:H.Samples.i) * H.pars.i[1] + (H.Samples.i:0) * H.pars.i[3]) / H.Samples.i  # All possible mean outcomes from option A with sample size H.Samples
        H.Probabilities <- dbinom(0:H.Samples.i, H.Samples.i, H.pars.i[2])  # Probability of obtaining each possible mean outcome from option A with sample size H.Samples
        
      }
      
      if(L.Samples.i > 0) {
        
        L.Means <- ((0:L.Samples.i) * L.pars.i[1] + (L.Samples.i:0) * L.pars.i[3]) / L.Samples.i  # All possible mean outcomes from option A with sample size L.Samples
        L.Probabilities <- dbinom(0:L.Samples.i, L.Samples.i, L.pars.i[2])  # Probability of obtaining each possible mean outcome from option A with sample size L.Samples
        
      }
      ### Add the joint probabilities when H beats L
      
      if(H.Samples.i > 0 & L.Samples.i > 0) {
        
        P.Want.H <- sum(unlist(lapply(1:length(H.Means), 
             function(x) {
                 sum(L.Probabilities[H.Means[x] > L.Means] * H.Probabilities[x]) + 
                 .5 * sum(L.Probabilities[H.Means[x] == L.Means] * H.Probabilities[x])
             })))
    
      }
      
      if(H.Samples.i == 0 & L.Samples.i > 0) {P.Want.H <- sum(L.Probabilities[L.Means < 0]) + .5 * sum(L.Probabilities[L.Means == 0])}
      if(H.Samples.i > 0 & L.Samples.i == 0) {P.Want.H <- sum(H.Probabilities[H.Means > 0]) + .5 * sum(H.Probabilities[H.Means == 0])}
      
      
      return(P.Want.H)
      
    }
    
    
    P.Want.H <- rep(NA, N.Gambles)
    
    for (Gambles.i in 1:N.Gambles) {
      
      Total.Samples.i <- Samples[Gambles.i]
      
      if(is.even(Total.Samples.i)) {
        
        P.Want.H.i <- Compare.Joint.Distribution(Total.Samples.i / 2, H.pars[Gambles.i, ], Total.Samples.i / 2, L.pars[Gambles.i, ])}
      
      if(is.odd(Total.Samples.i) & Total.Samples.i > 1) {
        
        P.Want.H.i <- mean(c(Compare.Joint.Distribution(floor(Total.Samples.i / 2), H.pars[Gambles.i, ], ceiling(Total.Samples.i / 2), L.pars[Gambles.i, ]), 
                             Compare.Joint.Distribution(ceiling(Total.Samples.i / 2), H.pars[Gambles.i, ], floor(Total.Samples.i / 2), L.pars[Gambles.i, ])
                             
        ))
      }
      
      if(Total.Samples.i == 1) {
        
        P.Want.H.i <- .5 * H.pars[Gambles.i, 2] + .5 * (1 - L.pars[Gambles.i, 2])
      }
      
      P.Want.H[Gambles.i] <- P.Want.H.i
    }
    
    P.Want.L <- 1 - P.Want.H
    
    output <- data.frame("p.Want.H" = P.Want.H, "p.Want.L" = P.Want.L)
    
    return(output)
    
  }
  
  
  
  
  
  ##### [CS.Comp.fun] "Competitive Sampling Competition Function"
  ## Given Gamble.A.pars (a matrix with columns being the positive, probability of positive, and negative outcome), Gamble.B.pars, Agent.Samples (The number of samples the Agent wants), Comp.Samples (The number of samples that the competitor wants), returns
  ## several outcome probabilities
  
  CS.Comp.fun <- function(
    Gamble.A.pars = cbind(runif(500, 0, 100), runif(500, 0, 1), runif(500, -100, 0)), 
    Gamble.B.pars = cbind(runif(500, 0, 100), runif(500, 0, 1), runif(500, -100, 0)), 
    PA.Samples = round(runif(500, 1, 1)), 
    PB.Samples = round(runif(500, 5, 15))
  ) 
    
    
  {
    
    Games.N <- length(PA.Samples)
    
    ## Figure out which gambles are H and L and define H and L parameters
    
    A.mu <- Gamble.A.pars[,1] * Gamble.A.pars[,2] + Gamble.A.pars[,3] * (1 - Gamble.A.pars[,2])
    B.mu <- Gamble.B.pars[,1] * Gamble.B.pars[,2] + Gamble.B.pars[,3] * (1 - Gamble.B.pars[,2])
    
    HEV.Option <- rep(NA, Games.N)
    HEV.Option[A.mu > B.mu] <- "A"
    HEV.Option[A.mu < B.mu] <- "B"
    
    Gamble.H.pars <- matrix(NA, nrow = Games.N, ncol = 3)
    Gamble.L.pars <- matrix(NA, nrow = Games.N, ncol = 3)
    
    Gamble.H.pars[HEV.Option == "A",] <- Gamble.A.pars[HEV.Option == "A",]
    Gamble.L.pars[HEV.Option == "A",] <- Gamble.B.pars[HEV.Option == "A"]
    
    Gamble.H.pars[HEV.Option == "B",] <- Gamble.B.pars[HEV.Option == "B",]
    Gamble.L.pars[HEV.Option == "B",] <- Gamble.A.pars[HEV.Option == "B",]
    
    
    ## Determine Player A's solitary game outcome
    
    PA.Ind.Game <- CS.Ind.fun(Gamble.H.pars, Gamble.L.pars, PA.Samples)
    
    p.PA.Want.H <- PA.Ind.Game$p.Want.H
    p.PA.Want.L <- PA.Ind.Game$p.Want.L
    
    ## Determine Player B's solitary game outcome
    
    PB.Ind.Game <- CS.Ind.fun(Gamble.H.pars,Gamble.L.pars, PB.Samples)
    
    p.PB.Want.H <- PB.Ind.Game$p.Want.H
    p.PB.Want.L <- PB.Ind.Game$p.Want.L
    


    # Now combine results to determine expected outcomes of competitive game
    
    ## Number of sampling rounds in competitive game is minimum number of planned samples
    
    Sampling.Rounds <- rowStats(cbind(PA.Samples, PB.Samples), my.fun = min)
    
    Chooser <- rep(NA, Games.N)
    
    Chooser[PA.Samples < PB.Samples] <- "A"
    Chooser[PA.Samples > PB.Samples] <- "B"
    Chooser[PA.Samples == PB.Samples] <- "Tie"
    
    Receiver <- rep(NA, Games.N)
    
    Receiver[Chooser == "A"] <- "B"
    Receiver[Chooser == "B"] <- "A"
    Receiver[Chooser == "Tie"] <- "Tie"
    
    Game.End <- rep(NA, Games.N)
    Game.End[Chooser == "Tie"] <- "Simultaneous"
    Game.End[Chooser == "A" | Chooser == "B"] <- "Stolen"
    
    ## Determine final player probabilities
    
    p.PA.Get.H <- rep(NA, Games.N)
    p.PB.Get.H <- rep(NA, Games.N)
    p.PA.Get.L <- rep(NA, Games.N)
    p.PB.Get.L <- rep(NA, Games.N)
    
    ## When player A is chooser
    
    p.PA.Get.H[Chooser == "A"] <- p.PA.Want.H[Chooser == "A"]
    p.PB.Get.H[Chooser == "A"] <- 1 - p.PA.Want.H[Chooser == "A"]
    p.PA.Get.L[Chooser == "A"] <- p.PA.Want.L[Chooser == "A"]
    p.PB.Get.L[Chooser == "A"] <- 1 - p.PA.Want.L[Chooser == "A"]
    
    ## When player B is chooser
    
    p.PB.Get.H[Chooser == "B"] <- p.PB.Want.H[Chooser == "B"]
    p.PA.Get.H[Chooser == "B"] <- 1 - p.PB.Want.H[Chooser == "B"]
    p.PB.Get.L[Chooser == "B"] <- p.PB.Want.L[Chooser == "B"]
    p.PA.Get.L[Chooser == "B"] <- 1 - p.PB.Want.L[Chooser == "B"]
    
    ## When it's a tie
    
    p.PA.Get.H[Chooser == "Tie"] <- p.PA.Want.H[Chooser == "Tie"] * p.PB.Want.L[Chooser == "Tie"]  + .5 * p.PA.Want.H[Chooser == "Tie"] * p.PB.Want.H[Chooser == "Tie"] + .5 * p.PA.Want.L[Chooser == "Tie"] * p.PB.Want.L[Chooser == "Tie"]

    p.PB.Get.H[Chooser == "Tie"] <- p.PB.Want.H[Chooser == "Tie"] * p.PA.Want.L[Chooser == "Tie"]  + .5 * p.PB.Want.H[Chooser == "Tie"] * p.PA.Want.H[Chooser == "Tie"] + .5 * p.PB.Want.L[Chooser == "Tie"] * p.PA.Want.L[Chooser == "Tie"]
    
    p.PA.Get.L[Chooser == "Tie"] <- p.PA.Want.L[Chooser == "Tie"] * p.PB.Want.H[Chooser == "Tie"]  + .5 * p.PA.Want.L[Chooser == "Tie"] * p.PB.Want.L[Chooser == "Tie"] + .5 * p.PA.Want.H[Chooser == "Tie"] * p.PB.Want.H[Chooser == "Tie"]

    p.PB.Get.L[Chooser == "Tie"] <- p.PB.Want.L[Chooser == "Tie"] * p.PA.Want.H[Chooser == "Tie"]  + .5 * p.PB.Want.L[Chooser == "Tie"] * p.PA.Want.L[Chooser == "Tie"] + .5 * p.PB.Want.H[Chooser == "Tie"] * p.PA.Want.H[Chooser == "Tie"]
    
    
    
    
    ## Now recode for Choosers and receivers
    
    p.Chooser.Get.H <- rep(NA, Games.N)
    p.Chooser.Get.L <- rep(NA, Games.N)
    
    p.Chooser.Get.H[Chooser == "A"] <- p.PA.Get.H[Chooser == "A"]
    p.Chooser.Get.H[Chooser == "B"] <- p.PB.Get.H[Chooser == "B"]
    
    p.Chooser.Get.L[Chooser == "A"] <- p.PA.Get.L[Chooser == "A"]
    p.Chooser.Get.L[Chooser == "B"] <- p.PB.Get.L[Chooser == "B"]
    
    p.Receiver.Get.H <- rep(NA, Games.N)
    p.Receiver.Get.L <- rep(NA, Games.N)
    
    p.Receiver.Get.H[Receiver == "A"] <- p.PA.Get.H[Receiver == "A"]
    p.Receiver.Get.H[Receiver == "B"] <- p.PB.Get.H[Receiver == "B"]
    
    p.Receiver.Get.L[Receiver == "A"] <- p.PA.Get.L[Receiver == "A"]
    p.Receiver.Get.L[Receiver == "B"] <- p.PB.Get.L[Receiver == "B"]
    
    
    
    
    
    output <- data.frame(
      "Game.End" = Game.End,
      "Chooser" = Chooser,
      "PA.Samples.Des" = PA.Samples,
      "PB.Samples.Des" = PB.Samples,
      "Sampling.Rounds" = Sampling.Rounds,
      "GA.x" = Gamble.A.pars[, 1],
      "GA.p" = Gamble.A.pars[, 2],
      "GA.y" = Gamble.A.pars[, 3],
      "GB.x" = Gamble.A.pars[, 1],
      "GB.p" = Gamble.A.pars[, 2],
      "GB.y" = Gamble.A.pars[, 3],
      "HEV.Option" = HEV.Option,
      "H.x" = Gamble.H.pars[, 1],
      "H.p" = Gamble.H.pars[, 2],
      "H.y" = Gamble.H.pars[, 3],
      "L.x" = Gamble.L.pars[, 1],
      "L.p" = Gamble.L.pars[, 2],
      "L.y" = Gamble.L.pars[, 3],
      "Ind.PA.Get.H" = p.PA.Want.H,
      "Ind.PA.Get.L" = p.PA.Want.L,
      "Ind.PB.Get.H" = p.PB.Want.H,
      "Ind.PB.Get.L" = p.PB.Want.L,
      "Comp.PA.Get.H" = p.PA.Get.H,
      "Comp.PA.Get.L" = p.PA.Get.L,
      "Comp.PB.Get.H" = p.PB.Get.H,
      "Comp.PB.Get.L" = p.PB.Get.L,
      "Comp.Chooser.Get.H" = p.Chooser.Get.H,
      "Comp.Chooser.Get.L" = p.Chooser.Get.L,
      "Comp.Receiver.Get.H" = p.Receiver.Get.H,
      "Comp.Receiver.Get.L" = p.Receiver.Get.L
    )
    
    return(output)
    
    
  }
  
  
}



## Example, how does a sample of size 1 compare to a random distribution from 5 to 10

OnevU510 <- CS.Comp.fun(PA.Samples = rep(1, 500), PB.Samples = round(runif(500, 5, 10)))

mean(OnevU510$Comp.PA.Get.H)   ### Here's how player A does
mean(OnevU510$Comp.PB.Get.H)   ### Here's how player B does


