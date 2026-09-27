//
//  apSearchViewController.m
//  ArianPrototype
//
//  Created by Mihailo Despotovic on 12/24/13.
//  Copyright (c) 2013 MiRteh. All rights reserved.
//

#import "apSearchViewController.h"
#import "apAppDelegate.h"

@interface apSearchViewController ()

@end

@implementation apSearchViewController

@synthesize searchResults;
@synthesize searchTableView;

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
    [[self navigationItem] setTitle:@"Search Arian Products"];
}

- (void)didReceiveMemoryWarning
{
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

# pragma search delegate

- (void)searchBar:(UISearchBar *)searchBar textDidChange:(NSString *)searchText
{
    [self refreshSearch:searchText];
}

- (void)searchBarCancelButtonClicked:(UISearchBar *)searchBar
{
    [searchBar resignFirstResponder];
}

- (void)searchBarSearchButtonClicked:(UISearchBar *)searchBar
{
    [searchBar resignFirstResponder];
    // do the search
    
    NSString *text = [searchBar text];
    [self refreshSearch:text];
    
}

- (void)refreshSearch:(NSString *)text {
    apAppDelegate *appDelegate = (apAppDelegate *)[[UIApplication sharedApplication] delegate];
    searchResults = [[appDelegate data] search:text];
    [searchTableView performSelectorOnMainThread:@selector(reloadData) withObject:nil waitUntilDone:NO];
}

# pragma table view

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

# pragma segue

- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender
{
    // todo branch based on product
    
    //if([[segue identifier] isEqualToString:@"showDetail"]) {
        NSIndexPath *indexPath = [self.searchTableView indexPathForSelectedRow];
        int row = indexPath.row;
        NSString *name = searchResults[row];
        [[segue destinationViewController] setTitle:name];
    
        //NSString *fileName = [NSString stringWithFormat:@"%@ %@", [self title], name];
        //[[segue destinationViewController] setFileName:fileName];
    //}
}

@end
