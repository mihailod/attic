//
//  apShoppingCart.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apShoppingCart.h"
#import "apAppDelegate.h"
#import "apItemInCart.h"
#import "apProductDetailViewController.h"

#define kBgQueue dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0)

#define PLACE_ORDER_TAG 666

@interface apShoppingCart ()

@end

@implementation apShoppingCart

@synthesize empty;

@synthesize tableViewCart;
@synthesize total;
@synthesize sum;
@synthesize placeOrder;
@synthesize emptyCart;

@synthesize spinner;

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
    [spinner stopAnimating];
	// Do any additional setup after loading the view.
    [self refreshView];
    
}

- (void) refreshView {
    
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    NSMutableArray *cart = [appDelegate cart];
    int itemsInCart = [cart count];
    if (itemsInCart == 0) {
        [empty setHidden:FALSE];
        
        [tableViewCart setHidden:TRUE];
        [total setHidden:TRUE];
        [sum setHidden:TRUE];
        [placeOrder setHidden:TRUE];
        [emptyCart setHidden:TRUE];
        
    } else {
        [empty setHidden:TRUE];
        
        [tableViewCart setHidden:FALSE];
        [total setHidden:false];
        [sum setHidden:false];
        [placeOrder setHidden:false];
        [emptyCart setHidden:false];
        
        float totalSum = 0;// = 399 * itemsInCart;
        for (int i=0; i<itemsInCart; i++) {
            totalSum += [((apItemInCart *)[cart objectAtIndex:i]) price];
        }
        
        NSString *sumText = [[[appDelegate data] euroFormatter] stringFromNumber:[NSNumber numberWithFloat:totalSum]];
        [sum setText:sumText];
    }
    
    // adjust the badge number accordingly
    int cartTabBarItemIndex = 2; // a hack but works if the tab bar items are static
    UITabBarItem *cartTabBarItem = [[[[self tabBarController] viewControllers] objectAtIndex:cartTabBarItemIndex] tabBarItem];
    NSString *newBadgeValue = [cart count] == 0 ? nil : [NSString stringWithFormat:@"%d", itemsInCart];
    [cartTabBarItem setBadgeValue:newBadgeValue];
    
    [tableViewCart reloadData];
}

- (void)viewDidAppear:(BOOL)animated {
    [self refreshView];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

# pragma cart actions

- (IBAction) emptyCartAction {
    UIAlertView *alert = [[UIAlertView alloc] init];
    //[alert setTitle:@"Empty the Cart?"];
    [alert setMessage:@"Remove all items from the cart?"];
    [alert setDelegate:self];
    [alert addButtonWithTitle:@"Yes"];
    [alert addButtonWithTitle:@"No"];
    [alert setDelegate:self];
    [alert show];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 0) {
        if ([alertView tag] == PLACE_ORDER_TAG) {
            [self placeOrderLogic];
        } else {
            [self emptyCartLogic];
        }
    }
    else if (buttonIndex == 1) {
        // No
    }
}

- (void)emptyCartLogic
{
    int cartTabBarItemIndex = 2; // a hack but works if the tab bar items are static
    UITabBarItem *cartTabBarItem = [[[[self tabBarController] viewControllers] objectAtIndex:cartTabBarItemIndex] tabBarItem];
    [cartTabBarItem setBadgeValue:nil];
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    [[appDelegate cart] removeAllObjects];
    [self refreshView];
}

- (void)placeOrderLogic
{
    [placeOrder setEnabled:false];
    [emptyCart setEnabled:false];
    [spinner startAnimating];
    dispatch_async(kBgQueue, ^{
        sleep(2);
        [self performSelectorOnMainThread:@selector(buyDone) withObject:nil waitUntilDone:YES];
    });
}

- (IBAction) placeOrderAction
{
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    if (!appDelegate.loggedIn) {
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Not Logged In"
                                                        message:@"To place an order, you must be logged in first. Go to the account screen and log in."
                                                       delegate:nil
                                              cancelButtonTitle:@"OK"
                                              otherButtonTitles:nil];
        [alert show];
        return;
    }
    
    UIAlertView *alert = [[UIAlertView alloc] init];
    //[alert setTitle:@"Empty the Cart?"];
    [alert setMessage:@"Place order with Arian?"];
    [alert setDelegate:self];
    [alert addButtonWithTitle:@"Yes"];
    [alert addButtonWithTitle:@"No"];
    [alert setDelegate:self];
    [alert setTag:PLACE_ORDER_TAG];
    [alert show];
}

- (void) buyDone
{
    [spinner stopAnimating];
    [placeOrder setEnabled:true];
    [emptyCart setEnabled:true];
    
    [self emptyCartLogic];
    
    UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Thank You"
                                                    message:@"Your order was processed.\nOrder number: W45589340\nReceipt will be sent to your email."
                                                   delegate:nil
                                          cancelButtonTitle:@"OK"
                                          otherButtonTitles:nil];
    [alert show];
}


# pragma table view

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    NSMutableArray *cart = [appDelegate cart];
    return [cart count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier forIndexPath:indexPath];
    int i = indexPath.row;
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    NSMutableArray *cart = [appDelegate cart];
    
    NSString *name = [(apItemInCart *)[cart objectAtIndex:i] name];
    /*if ([name length] > 23) {
        name = [name substringToIndex: 23];
        name = [NSString stringWithFormat:@"%@%@", name, @"..."];
    }*/
    cell.textLabel.text = [[[appDelegate data] euroFormatter] stringFromNumber:[NSNumber numberWithFloat:[(apItemInCart *)[cart objectAtIndex:i] price]]];
    NSString *quantityString = [NSString stringWithFormat:@"%d ", [(apItemInCart *)[cart objectAtIndex:i] quantity]];
    NSString *detailText = [quantityString stringByAppendingString:name];

    cell.detailTextLabel.text = detailText;
    cell.imageView.image = [[cart objectAtIndex:i] image];
   
    return cell;
}

# pragma editable table

- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath {
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // what should happen when one hits delete
        apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
        NSMutableArray *cart = [appDelegate cart];
        [cart removeObjectAtIndex:[indexPath row]];
        [self refreshView];
    }
}

# pragma segue

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    NSMutableArray *cart = [appDelegate cart];
    //if([[segue identifier] isEqualToString:@"cartToDetail"]) {
    NSIndexPath *indexPath = [tableViewCart indexPathForSelectedRow];
    int row = indexPath.row;
    NSString *name = [(apItemInCart *)[cart objectAtIndex:row] name];
    [[segue destinationViewController] setTitle:name];
    //[((apProductDetailViewController *)segue.destinationViewController).addToCart setTitle:@"Update" forState:UIControlStateNormal];
    ((apProductDetailViewController *)segue.destinationViewController).cartItemObject = (apItemInCart *)[cart objectAtIndex:row];
    ((apProductDetailViewController *)segue.destinationViewController).updateCartItemMode = TRUE;
}

@end
