//
//  apAccountVC.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/25/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apAccountVC.h"
#import "apAppDelegate.h"

#define kBgQueue dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)

@interface apAccountVC ()

@end

@implementation apAccountVC

@synthesize usernameTF;
@synthesize passwordTF;

@synthesize loginButton;

@synthesize spinner;

@synthesize emailLabel;
@synthesize paymentLabel;
@synthesize billLabel;
@synthesize shipLabel;
@synthesize promoLabel;
@synthesize cardImage;

@synthesize billTV;
@synthesize shipTV;
@synthesize billImage;
@synthesize shipImage;

@synthesize emailTF;
@synthesize payMethodTF;
@synthesize payExpTF;
@synthesize payNumberTF;

@synthesize promoSwitch;


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
	// Do any additional setup after loading the view.
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    appDelegate.loggedIn = false;
    [self refreshView];
    
    [billImage.layer setBorderColor: [[UIColor blackColor] CGColor]];
    [billImage.layer setBorderWidth: 0.3];
    
    [shipImage.layer setBorderColor: [[UIColor blackColor] CGColor]];
    [shipImage.layer setBorderWidth: 0.3];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)refreshView
{
    [spinner stopAnimating];
    
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    bool loggedIn = appDelegate.loggedIn;
    
    if (!loggedIn) {
        [usernameTF setText:@""];
        [passwordTF setText:@""];
    }
    
    [loginButton setTitle:(loggedIn ? @"Logout" : @"Login") forState:UIControlStateNormal];
        
    [emailLabel setHidden:!loggedIn];
    [paymentLabel setHidden:!loggedIn];
    [billLabel setHidden:!loggedIn];
    [shipLabel setHidden:!loggedIn];
    [promoLabel setHidden:!loggedIn];
        
    [billTV setHidden:!loggedIn];
    [shipTV setHidden:!loggedIn];
        
    [emailTF setHidden:!loggedIn];
    [payMethodTF setHidden:!loggedIn];
    [payExpTF setHidden:!loggedIn];
    [payNumberTF setHidden:!loggedIn];
        
    [promoSwitch setHidden:!loggedIn];
    
    [cardImage setHidden:!loggedIn];
    [billImage setHidden:!loggedIn];
    [shipImage setHidden:!loggedIn];
}

- (IBAction) loginAction
{
    if ([[usernameTF text] length] == 0) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:nil
                                                        message:@"Please enter the username"
                                                       delegate:nil
                                              cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
        return;
    }
    if ([[passwordTF text] length] == 0) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:nil
                                                        message:@"Please enter the password"
                                                       delegate:nil
                                              cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
        return;
    }
    
    // todo spin a bit here
    
    [loginButton setEnabled:false];
    [spinner startAnimating];
    dispatch_async(kBgQueue, ^{
        sleep(1);
        [self performSelectorOnMainThread:@selector(loginDone) withObject:nil waitUntilDone:YES];
    });
    

}

-(void) loginDone
{
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    appDelegate.loggedIn = !appDelegate.loggedIn;
    
    [usernameTF resignFirstResponder];
    [passwordTF resignFirstResponder];
    
    if (!appDelegate.loggedIn) {
        [[appDelegate cart] removeAllObjects];
        // adjust the badge number accordingly
        int cartTabBarItemIndex = 2; // a hack but works if the tab bar items are static
        UITabBarItem *cartTabBarItem = [[[[self tabBarController] viewControllers] objectAtIndex:cartTabBarItemIndex] tabBarItem]; // setBadgeValue:badgeValue];
        [cartTabBarItem setBadgeValue:nil];
    }
    
    [self refreshView];
    
    [spinner stopAnimating];
    [loginButton setEnabled:true];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField {
    [textField resignFirstResponder];
    return NO;
}

@end
