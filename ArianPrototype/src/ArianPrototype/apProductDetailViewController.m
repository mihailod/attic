//
//  apProductDetailViewController.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apProductDetailViewController.h"
#import "apAppDelegate.h"
#import "apItemInCart.h"
#import "apData.h"

@interface apProductDetailViewController ()

@end

@implementation apProductDetailViewController

@synthesize spinner;
@synthesize addToCart;
@synthesize descriptionTV; // height 223 on iPhone 5, 223 - 88 on iPhone 3.5
@synthesize image;
@synthesize price;

@synthesize format;
@synthesize formatPic;
@synthesize resolution;
@synthesize delivery;
@synthesize resolutionLabel;
@synthesize deliveryLabel;
@synthesize quantity, quantityStepper;

@synthesize cartItemObject;
@synthesize updateCartItemMode;
@synthesize alreadyPopulatedGuiFromCartItem;

- (id)initWithNibName:(NSString *)nibNameOrNil bundle:(NSBundle *)nibBundleOrNil
{
    self = [super initWithNibName:nibNameOrNil bundle:nibBundleOrNil];
    if (self) {
        // Custom initialization
    }
    return self;
}

- (void)viewDidLoad
{
    [super viewDidLoad];
    [self refresh];
}

- (void)viewDidAppear:(BOOL)animated { [self refresh]; }

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

# pragma add to cart

- (IBAction) addToCartAction {
    
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    if (!appDelegate.loggedIn) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Not Logged In"
                                                        message:@"To start shopping, you must be logged in first. Go to the account screen and log in."
                                                       delegate:nil
                                              cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
        return;
    }
    
    [addToCart setEnabled:false];
    [spinner startAnimating];
    
    //NSString *url = @"https://www.linkedin.com";
    NSString *url = @"file:///Users/mihailod/Documents/links.html";
    NSURLSession *session = [NSURLSession sharedSession];
    [[session dataTaskWithURL:[NSURL URLWithString:url]
            completionHandler:^(NSData *data,
                                NSURLResponse *response,
                                NSError *error) {
                // handle response
                
                NSString *responseString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                NSLog(@"%@", responseString);
                
                // add the cart item
                NSMutableArray *cart = [appDelegate cart];
                if (!updateCartItemMode) {
                    apItemInCart *original = (apItemInCart*)cartItemObject;
                    apItemInCart *copy = [original copy:original];
                    [cart addObject:copy];
                }
                
                [self performSelectorOnMainThread:@selector(completeRequest) withObject:nil waitUntilDone:NO];
                
            }] resume];
}

-(void)completeRequest {
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];

    NSMutableArray *cart = [appDelegate cart];

    // adjust the badge number accordingly
    int cartTabBarItemIndex = 2; // a hack but works if the tab bar items are static
    UITabBarItem *cartTabBarItem = [[[[self tabBarController] viewControllers] objectAtIndex:cartTabBarItemIndex] tabBarItem]; // setBadgeValue:badgeValue];
    int itemsInCart = [cart count];
    NSString *newBadgeValue = [NSString stringWithFormat:@"%d", itemsInCart];
    [cartTabBarItem setBadgeValue:newBadgeValue];
    
    [spinner stopAnimating];
    [addToCart setEnabled:true];
    
    /*if (updateCartItemMode) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:nil
                                                        message:@"This cart item has been updated."
                                                       delegate:nil
                                              cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
        return;
    }*/
}

# pragma pickers

// returns the number of 'columns' to display.
- (NSInteger)numberOfComponentsInPickerView:(UIPickerView *)pickerView
{
    return 1;
}

// returns the # of rows in each component..
- (NSInteger)pickerView:(UIPickerView *)pickerView numberOfRowsInComponent: (NSInteger)component
{
    if ([pickerView tag] == 2) {
        return 3;
    } else {
        return 12;
    }
}

-(NSString *)pickerView:(UIPickerView *)pickerView titleForRow:(NSInteger)row forComponent:(NSInteger)component
{
        if (row == 0) {
            return @"20\" x 10\"";
        } else if (row == 1) {
            return @"24\" x 12\"";
        } else if (row == 2) {
            return @"36\" x 12\"";
        } else if (row == 3) {
            return @"48\" x 12\"";
        } else if (row == 4) {
            return @"48\" x 16\"";
        } else if (row == 5) {
            return @"3 panel splits 48\" x 16\"";
        } else if (row == 6) {
            return @"4 panel splits 48\" x 16\"";
        } else if (row == 7) {
            return @"48\" x 24\"";
        } else if (row == 8) {
            return @"3 panel splits 48\" x 24\"";
        } else if (row == 9) {
            return @"4 panel splits 48\" x 24\"";
        } else if (row == 10) {
            return @"60\" x 30\"";
        } else if (row == 11) {
            return @"3 panel splits 60\" x 30\"";
        } else {
            return @"???";
        }
}

-(void)pickerView:(UIPickerView *)pickerView didSelectRow:(NSInteger)row inComponent:(NSInteger)component { [self refresh]; }
-(IBAction)deliveryAction { [self refresh]; }
-(IBAction)stepperValueChanged { [self refresh]; }

-(void)refresh
{
    [spinner stopAnimating];
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    
    if (updateCartItemMode) {
        [addToCart setTitle:@"Update" forState:UIControlStateNormal];
    } else {
        [addToCart setTitle:@"Add to Cart" forState:UIControlStateNormal];
    }
    
    if (updateCartItemMode) {
        apItemInCart *cartItem = (apItemInCart *)cartItemObject;

        // divergent fields. todo generalize
        if (!alreadyPopulatedGuiFromCartItem) {
            if ([[[self navigationItem] title] isEqualToString:@"Panoramic Canvas"]) {
                [descriptionTV setHidden:true];
                
                [format setHidden:false];
                [format selectRow:[cartItem format] inComponent:0 animated:false];
                
                [formatPic setHidden:false];
                [formatPic setImage:([[[appDelegate data] panoramicCanvasFormatImages] objectAtIndex:[cartItem format]])];

                [resolutionLabel setHidden:false];
                
                [resolution setHidden:false];
                [resolution setText:([[[appDelegate data] panoramicCanvasResolutions] objectAtIndex:[cartItem format]])];
            } else {
                [descriptionTV setHidden:false]; // todo will probably need description field too in the cart object
                
                [format setHidden:true];
                
                [formatPic setImage:[UIImage imageNamed:@"InkCans"]]; // todo hack?
                
                [resolutionLabel setHidden:true];
                
                [resolution setHidden:true];
            }
            
            // common fields
            [image setImage:[cartItem image]];
            NSArray *quantities = [[appDelegate data] quantities];
            int quantityStepperValue = 0;
            for (int i=0; i<quantities.count; i++) {
                if ([[quantities objectAtIndex:i] integerValue] == [cartItem quantity]) {
                    quantityStepperValue = i + 1;
                    break;
                }
            }
            [quantityStepper setValue:quantityStepperValue];
            [quantity setText: [NSString stringWithFormat:@"%d", [cartItem quantity]]];
            [delivery setSelectedSegmentIndex:[cartItem delivery]];
            
            int discountPercent = (int)[cartItem discount]; // todo use floats
            NSString *discountString = [NSString stringWithFormat:@" (%d%% off)", discountPercent];
            if (discountPercent == 0) {
                discountString = @"";
            }
            NSString *sumText = [[[appDelegate data] euroFormatter] stringFromNumber:[NSNumber numberWithFloat:[cartItem price]]];
            NSString *finalPriceText = [sumText stringByAppendingString:discountString];
            [price setText:finalPriceText];
                
            alreadyPopulatedGuiFromCartItem = true;
        }
    } else {
        [self refreshGui];
        cartItemObject = [[apItemInCart alloc] init];
    }
    
    // populate or update the cart object from the GUI
    apItemInCart *cartItem = (apItemInCart*)cartItemObject;

    int selectedFormat = [format selectedRowInComponent:0];
    int stepperValue = (int)quantityStepper.value;
    int quantityValue = [(NSNumber *)[[[appDelegate data] quantities] objectAtIndex:(stepperValue - 1)] intValue];
    int discountPercent = (stepperValue - 1) * 2;
    float discount = (float)discountPercent / 100.00;
    int shippingMethod = delivery.selectedSegmentIndex;
    float shippingPrice = [(NSNumber *)[[[appDelegate data] shippingPrices] objectAtIndex:shippingMethod] floatValue];
    float canvasPrice = [(NSNumber *)[[[appDelegate data] panoramicCanvasPrices] objectAtIndex:selectedFormat] floatValue];
    float finalPrice = canvasPrice * (1 - discount) * quantityValue + shippingPrice;
    
    cartItem.name = [[self navigationItem] title];
    cartItem.price = finalPrice;
    cartItem.image = [image image];
    cartItem.format = [format selectedRowInComponent:0];
    cartItem.delivery = shippingMethod;
    cartItem.discount = discountPercent;
    cartItem.quantity = quantityValue;

    // refresh the GUI objects
    [self refreshGui];
}

-(void)refreshGui
{
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    int selectedFormat = [format selectedRowInComponent:0];
    int stepperValue = (int)quantityStepper.value;
    int quantityValue = [(NSNumber *)[[[appDelegate data] quantities] objectAtIndex:(stepperValue - 1)] intValue];
    int discountPercent = (stepperValue - 1) * 2;
    float discount = (float)discountPercent / 100.00;
    int shippingMethod = delivery.selectedSegmentIndex;
    float shippingPrice = [(NSNumber *)[[[appDelegate data] shippingPrices] objectAtIndex:shippingMethod] floatValue];
    float canvasPrice = [(NSNumber *)[[[appDelegate data] panoramicCanvasPrices] objectAtIndex:selectedFormat] floatValue];
    float finalPrice = canvasPrice * (1 - discount) * quantityValue + shippingPrice;
    
    // gui population
    NSString *discountString = [NSString stringWithFormat:@" (%d%% off)", discountPercent];
    if (discountPercent == 0) {
        discountString = @"";
    }
    NSString *sumText = [[[appDelegate data] euroFormatter] stringFromNumber:[NSNumber numberWithFloat:finalPrice]];
    NSString *finalPriceText = [sumText stringByAppendingString:discountString];
    [price setText:finalPriceText];
    [quantity setText: [NSString stringWithFormat:@"%d", quantityValue]];
    [resolution setText:([[[appDelegate data] panoramicCanvasResolutions] objectAtIndex:selectedFormat])];
    
    if ([[[self navigationItem] title] isEqualToString:@"Panoramic Canvas"]) {
        [descriptionTV setHidden:true];
        [image setImage:[UIImage imageNamed: @"canvas"]];
        [formatPic setImage:([[[appDelegate data] panoramicCanvasFormatImages] objectAtIndex:selectedFormat])];
        
    } else {
        [descriptionTV setHidden:false];
        [image setImage:[UIImage imageNamed:@"product"]];
        [formatPic setImage:[UIImage imageNamed:@"InkCans"]];
        [format setHidden:true];
        [resolution setHidden:true];
        [resolutionLabel setHidden:true];
    }
}

@end
