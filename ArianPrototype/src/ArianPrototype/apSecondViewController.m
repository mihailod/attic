//
//  apSecondViewController.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/18/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apSecondViewController.h"
#import "apAppDelegate.h"

@interface apSecondViewController ()

@end

@implementation apSecondViewController

@synthesize searchResults;
@synthesize searchField;
@synthesize searchTableView;

- (void)viewDidLoad
{
    [super viewDidLoad];
	// Do any additional setup after loading the view, typically from a nib.
    
    searchField.returnKeyType = UIReturnKeyDone;
    [searchField setDelegate:self];
}

- (BOOL)textFieldShouldReturn:(UITextField *)textField
{
    [textField resignFirstResponder];
    return TRUE;
}

- (void)textFieldDidEndEditing:(UITextField *)textField
{
    NSString *text = textField.text;
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    searchResults = [[appDelegate data] search:text];
    
    [searchTableView performSelectorOnMainThread:@selector(reloadData) withObject:nil waitUntilDone:NO];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView
{
    // Return the number of sections.
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section
{
    // Return the number of rows in the section.
    return searchResults.count;
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *CellIdentifier = @"Cell";
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:CellIdentifier forIndexPath:indexPath];
    NSString *name = searchResults[indexPath.row];
    cell.textLabel.text = name;
    return cell;
}

@end
