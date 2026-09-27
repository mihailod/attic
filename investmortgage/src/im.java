/**
 * Created by mihailod, May 4, 2008, 8:47:40 AM
 */
public class im {
    // 30 years, 6%, $100K interests for each year
    private static final double[] INTEREST = {
    5966.59,
    5890.85,
    5810.44,
    5725.07,
    5634.43,
    5538.20,
    5436.04,
    5327.57,
    5212.42,
    5090.16,
    4960.37,
    4822.56,
    4676.26,
    4520.93,
    4356.03,
    4180.95,
    3995.07,
    3797.73,
    3588.22,
    3365.79,
    3129.64,
    2878.92,
    2612.74,
    2330.14,
    2030.11,
    1711.57,
    1373.39,
    1014.35,
    633.16,
    228.47
    };

    // these should be command line params
    private static double portfolioApr = 7.6;
    private static double taxRate = 40;
    private static double initialSum = 100000;
    private static double income = 200000;

    public static void main(String[] args) {

        // multipliers
        final double taxMultiplier = (100 - taxRate)/100;
        final double portfolioMultiplier = (100 + portfolioApr)/100;

        // initial values
        double currentBalance = initialSum;
        double totalInterest = 0;

        // for each year compound the profit
        for(int i = 0; i < 30; i++) {
            final double in = ((currentBalance * portfolioMultiplier) - currentBalance) * taxMultiplier;
            final double out = INTEREST[i];

            final double taxNoMortgage = income * (1 - taxMultiplier);
            final double taxWithMortgage = (income - out) * (1 - taxMultiplier);
            final double interestTaxReturn = taxNoMortgage - taxWithMortgage;

            final double profit = in - out + interestTaxReturn;
            currentBalance += profit;
            totalInterest += out;

            System.out.println("Year " + (i+1) + ": profit " + profit + ", new balance " + currentBalance);
        }

        System.out.println("-------------------");
        System.out.println("After 30yrs total pre-tax interest paid: " + totalInterest);
        System.out.println("After 30yrs final balance: " + currentBalance);
        System.out.println("After 30yrs pre-tax profit: " + (currentBalance - totalInterest - initialSum));
    }
}















